import { createClient } from '@supabase/supabase-js';
import { validateStoreSlug } from './store-slug';

/**
 * Server-side store management (TODO-045). Uses the service-role client —
 * every entry point re-derives authorization from the session-provided
 * userId (membership checked here), never from request payloads.
 */
function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface StoreRecord {
  id: string;
  slug: string | null;
  name: string;
  name_ar: string | null;
  logo_url: string | null;
  bio: string | null;
  bio_ar: string | null;
  is_published: boolean;
  commission_bps: number;
  published_product_count: number;
  role: 'owner' | 'manager' | 'packer' | 'viewer';
}

async function orgIdForUser(userId: string): Promise<string> {
  const svc = serviceClient();
  const { data: profile } = await svc
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .maybeSingle();
  if (profile?.organization_id) return profile.organization_id;

  const { data: membership } = await svc
    .from('team_members')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (membership?.organization_id) return membership.organization_id;

  // New signup after the tenancy migration: provision now (idempotent).
  const { data: orgId, error } = await svc.rpc('ensure_org_for_user', { p_user_id: userId });
  if (error) throw error;
  return orgId as string;
}

async function roleForUser(orgId: string, userId: string): Promise<StoreRecord['role'] | null> {
  const svc = serviceClient();
  const { data: org } = await svc
    .from('organizations')
    .select('owner_user_id')
    .eq('id', orgId)
    .single();
  if (org?.owner_user_id === userId) return 'owner';
  const { data: member } = await svc
    .from('team_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();
  return (member?.role as StoreRecord['role']) ?? null;
}

export async function getStoreForUser(userId: string): Promise<StoreRecord> {
  const svc = serviceClient();
  const orgId = await orgIdForUser(userId);
  const [{ data: org, error }, role, { count }] = await Promise.all([
    svc
      .from('organizations')
      .select('id, slug, name, name_ar, logo_url, bio, bio_ar, is_published, commission_bps')
      .eq('id', orgId)
      .single(),
    roleForUser(orgId, userId),
    svc
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_published', true),
  ]);
  if (error || !org) throw error ?? new Error('store not found');
  return { ...org, published_product_count: count ?? 0, role: role ?? 'viewer' };
}

export interface StorePatch {
  name?: string;
  name_ar?: string | null;
  slug?: string;
  logo_url?: string | null;
  bio?: string | null;
  bio_ar?: string | null;
  is_published?: boolean;
}

export type StoreUpdateResult =
  | { ok: true; store: StoreRecord }
  | { ok: false; status: number; error: string };

export async function updateStoreForUser(
  userId: string,
  patch: StorePatch
): Promise<StoreUpdateResult> {
  const svc = serviceClient();
  const orgId = await orgIdForUser(userId);
  const role = await roleForUser(orgId, userId);
  if (role !== 'owner' && role !== 'manager') {
    return { ok: false, status: 403, error: 'Only owners and managers can edit the store' };
  }

  const update: Record<string, unknown> = {};

  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (name.length < 2 || name.length > 80) {
      return { ok: false, status: 400, error: 'Store name must be 2-80 characters' };
    }
    update.name = name;
  }

  if (patch.slug !== undefined) {
    const slug = patch.slug.trim().toLowerCase();
    const valid = validateStoreSlug(slug);
    if (!valid.ok) {
      return { ok: false, status: 400, error: `slug_${valid.error}` };
    }
    const { data: taken } = await svc
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .neq('id', orgId)
      .maybeSingle();
    if (taken) {
      return { ok: false, status: 409, error: 'slug_taken' };
    }
    update.slug = slug;
  }

  for (const key of ['name_ar', 'logo_url', 'bio', 'bio_ar'] as const) {
    if (patch[key] !== undefined) {
      const value = patch[key];
      if (typeof value === 'string' && value.length > 2000) {
        return { ok: false, status: 400, error: `${key}_too_long` };
      }
      update[key] = value === '' ? null : value;
    }
  }

  if (patch.is_published !== undefined) {
    if (patch.is_published) {
      const { count } = await svc
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('is_published', true);
      if (!count) {
        return { ok: false, status: 400, error: 'publish_requires_product' };
      }
    }
    update.is_published = patch.is_published;
  }

  if (Object.keys(update).length > 0) {
    const { error } = await svc.from('organizations').update(update).eq('id', orgId);
    if (error) return { ok: false, status: 500, error: error.message };
  }

  return { ok: true, store: await getStoreForUser(userId) };
}

export type PublishResult =
  | { ok: true; product_published: boolean; store_published: boolean; storefront_path: string | null }
  | { ok: false; status: number; error: string };

/**
 * Publish/unpublish a listing. Publishing the org's FIRST product also
 * publishes the store (acceptance: store goes live with its first listing).
 */
export async function setProductPublished(
  userId: string,
  productId: string,
  published: boolean
): Promise<PublishResult> {
  const svc = serviceClient();
  const orgId = await orgIdForUser(userId);
  const role = await roleForUser(orgId, userId);
  if (role !== 'owner' && role !== 'manager') {
    return { ok: false, status: 403, error: 'Only owners and managers can publish listings' };
  }

  const { data: product, error } = await svc
    .from('products')
    .update({ is_published: published })
    .eq('id', productId)
    .eq('org_id', orgId)
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, status: 500, error: error.message };
  if (!product) return { ok: false, status: 404, error: 'Product not found in your store' };

  let storePublished = false;
  const { data: org } = await svc
    .from('organizations')
    .select('slug, is_published')
    .eq('id', orgId)
    .single();

  if (published && org && !org.is_published) {
    await svc.from('organizations').update({ is_published: true }).eq('id', orgId);
    storePublished = true;
  }

  return {
    ok: true,
    product_published: published,
    store_published: storePublished || !!org?.is_published,
    storefront_path: org?.slug ? `/s/${org.slug}` : null,
  };
}

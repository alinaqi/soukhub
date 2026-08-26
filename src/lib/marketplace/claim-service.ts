import { createClient } from '@supabase/supabase-js';
import { getStoreForUser, type StoreRecord } from './store-service';

/**
 * Claim-my-store (ADR 0017 conversion path): a directory provider becomes a
 * SoukHub seller org. First-write-wins on claimed_org_id; a fresh org (no
 * products, unpublished) inherits the shop's public identity as its store.
 */
function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export type ClaimResult =
  | { ok: true; store: StoreRecord; store_path: string; prefilled: boolean }
  | { ok: false; status: number; error: string };

interface ClaimableProvider {
  id: string;
  name: string;
  area: string | null;
  emirate: string | null;
  image_url: string | null;
  claimed_org_id: string | null;
}

async function prefillFreshOrg(orgId: string, provider: ClaimableProvider): Promise<boolean> {
  const svc = serviceClient();
  const [{ data: org }, { count }] = await Promise.all([
    svc.from('organizations').select('is_published, logo_url').eq('id', orgId).single(),
    svc.from('products').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
  ]);
  if (!org || org.is_published || (count ?? 0) > 0) return false;

  const bio = ['Mobile shop', provider.area, provider.emirate].filter(Boolean).join(' · ');
  await svc
    .from('organizations')
    .update({
      name: provider.name,
      logo_url: org.logo_url ?? provider.image_url,
      bio,
    })
    .eq('id', orgId);
  return true;
}

export async function claimProvider(userId: string, providerId: string): Promise<ClaimResult> {
  const svc = serviceClient();
  const { data: provider } = await svc
    .from('providers')
    .select('id, name, area, emirate, image_url, claimed_org_id')
    .eq('id', providerId)
    .eq('is_active', true)
    .maybeSingle();
  if (!provider) return { ok: false, status: 404, error: 'provider_not_found' };

  // Provisions the org on first touch and re-derives membership from session
  const store = await getStoreForUser(userId);
  if (store.role !== 'owner' && store.role !== 'manager') {
    return { ok: false, status: 403, error: 'not_store_owner' };
  }

  if (provider.claimed_org_id) {
    return provider.claimed_org_id === store.id
      ? { ok: true, store, store_path: '/settings/store', prefilled: false }
      : { ok: false, status: 409, error: 'already_claimed' };
  }

  // First write wins — the null guard makes concurrent claims lose cleanly
  const { data: claimed, error } = await svc
    .from('providers')
    .update({ claimed_org_id: store.id, claimed_at: new Date().toISOString() })
    .eq('id', provider.id)
    .is('claimed_org_id', null)
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, status: 500, error: error.message };
  if (!claimed) return { ok: false, status: 409, error: 'already_claimed' };

  const prefilled = await prefillFreshOrg(store.id, provider as ClaimableProvider);
  return {
    ok: true,
    store: prefilled ? await getStoreForUser(userId) : store,
    store_path: '/settings/store',
    prefilled,
  };
}

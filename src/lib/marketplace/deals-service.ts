import { createClient } from '@supabase/supabase-js';

/**
 * Seller-run deals: time-boxed prices on a seller's own products, promoted
 * marketplace-wide (home strip, product pages). One live deal per product
 * (partial unique index); public visibility only inside the active window.
 */
function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export type DealResult =
  | { ok: true; deal_id: string }
  | { ok: false; status: number; error: string };

interface CreateDealInput {
  product_id: string;
  deal_price: number;
  ends_at: string;
}

async function orgIdForUser(userId: string): Promise<string | null> {
  const svc = serviceClient();
  const { data } = await svc.from('profiles').select('organization_id').eq('id', userId).maybeSingle();
  if (data?.organization_id) return data.organization_id;
  const { data: member } = await svc
    .from('team_members')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  return member?.organization_id ?? null;
}

export async function createDeal(userId: string, input: CreateDealInput): Promise<DealResult> {
  const { product_id, deal_price, ends_at } = input;
  if (!(deal_price > 0)) return { ok: false, status: 400, error: 'price_invalid' };
  const endDate = new Date(ends_at);
  if (!isFinite(endDate.getTime()) || endDate.getTime() <= Date.now()) {
    return { ok: false, status: 400, error: 'end_date_invalid' };
  }

  const svc = serviceClient();
  const orgId = await orgIdForUser(userId);
  if (!orgId) return { ok: false, status: 403, error: 'no_org' };

  const { data: product } = await svc
    .from('products')
    .select('id, base_price')
    .eq('id', product_id)
    .eq('org_id', orgId)
    .maybeSingle();
  if (!product) return { ok: false, status: 404, error: 'product_not_found' };
  if (product.base_price != null && deal_price >= Number(product.base_price)) {
    return { ok: false, status: 400, error: 'price_not_below_base' };
  }

  // A naturally-expired deal still occupies the one-live-deal-per-product
  // slot (partial unique index) — sweep it before inserting
  await svc
    .from('deals')
    .update({ is_active: false })
    .eq('product_id', product_id)
    .eq('org_id', orgId)
    .eq('is_active', true)
    .lte('ends_at', new Date().toISOString());

  const { data: deal, error } = await svc
    .from('deals')
    .insert({ org_id: orgId, product_id, deal_price, ends_at: endDate.toISOString() })
    .select('id')
    .single();
  if (error) {
    if (error.code === '23505') return { ok: false, status: 409, error: 'deal_exists' };
    return { ok: false, status: 500, error: error.message };
  }
  return { ok: true, deal_id: deal.id };
}

export async function endDeal(userId: string, productId: string): Promise<DealResult> {
  const svc = serviceClient();
  const orgId = await orgIdForUser(userId);
  if (!orgId) return { ok: false, status: 403, error: 'no_org' };
  const { data, error } = await svc
    .from('deals')
    .update({ is_active: false })
    .eq('product_id', productId)
    .eq('org_id', orgId)
    .eq('is_active', true)
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, status: 500, error: error.message };
  if (!data) return { ok: false, status: 404, error: 'no_live_deal' };
  return { ok: true, deal_id: data.id };
}

export interface SellerDeal {
  id: string;
  deal_price: number;
  ends_at: string;
  product: {
    id: string;
    name: string;
    title_ar: string | null;
    brand: string | null;
    category: string | null;
    base_price: number | null;
    images: string[] | null;
    slug: string | null;
    short_id: string;
    org_id: string;
  };
  store_name?: string | null;
}

/** Live deals for public promotion (RLS window filter + published stores). */
export async function listSellerDeals(limit = 8): Promise<SellerDeal[]> {
  const { data, error } = await publicClient()
    .from('deals')
    .select(
      'id, deal_price, ends_at, product:products!inner(id, name, title_ar, brand, category, base_price, images, slug, short_id, org_id, is_published), org:organizations!inner(name, is_published)'
    )
    .eq('product.is_published', true)
    .eq('org.is_published', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as unknown as SellerDeal & {
      product: SellerDeal['product'] & { base_price: unknown };
      org: { name: string } | null;
    };
    return {
      id: r.id,
      deal_price: Number(r.deal_price),
      ends_at: r.ends_at,
      product: {
        ...r.product,
        base_price: r.product.base_price != null ? Number(r.product.base_price) : null,
      },
      store_name: r.org?.name ?? null,
    };
  });
}

/** A product's live deal price, if any (product/catalog pages). */
export async function getLiveDealForProduct(productId: string): Promise<{ deal_price: number; ends_at: string } | null> {
  const { data } = await publicClient()
    .from('deals')
    .select('deal_price, ends_at')
    .eq('product_id', productId)
    .maybeSingle();
  if (!data) return null;
  return { deal_price: Number(data.deal_price), ends_at: data.ends_at };
}

/** All deals of the caller's org, live and past (console). */
export async function listOrgDeals(userId: string) {
  const svc = serviceClient();
  const orgId = await orgIdForUser(userId);
  if (!orgId) return [];
  const { data, error } = await svc
    .from('deals')
    .select('id, deal_price, starts_at, ends_at, is_active, product:products(id, name, base_price, images)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

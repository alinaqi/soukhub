import { createClient } from '@supabase/supabase-js';

/**
 * Public (anon) data access for the buyer surface. RLS exposes only
 * published stores/listings (ADR 0009) — safe to call without a session,
 * cacheable by ISR.
 */
function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface PublicListing {
  id: string;
  name: string;
  title_ar: string | null;
  brand: string | null;
  category: string | null;
  base_price: number | null;
  images: string[] | null;
  slug: string;
  short_id: string;
  org_id: string;
  store_name?: string;
  store_slug?: string;
  description?: string | null;
  description_ar?: string | null;
}

export interface PublicStore {
  id: string;
  slug: string;
  name: string;
  name_ar: string | null;
  logo_url: string | null;
  bio: string | null;
  bio_ar: string | null;
}

export interface SearchFilters {
  q?: string;
  brand?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}

export async function searchListings(filters: SearchFilters): Promise<PublicListing[]> {
  const { data, error } = await publicClient().rpc('search_listings', {
    p_query: filters.q ?? '',
    p_brand: filters.brand ?? null,
    p_category: filters.category ?? null,
    p_min_price: filters.minPrice ?? null,
    p_max_price: filters.maxPrice ?? null,
    p_limit: filters.limit ?? 24,
    p_offset: filters.offset ?? 0,
  });
  if (error) throw error;
  return (data ?? []) as PublicListing[];
}

export async function getLatestListings(limit = 8): Promise<PublicListing[]> {
  return searchListings({ limit });
}

export async function getStoreBySlug(slug: string): Promise<PublicStore | null> {
  const { data } = await publicClient()
    .from('organizations')
    .select('id, slug, name, name_ar, logo_url, bio, bio_ar')
    .eq('slug', slug)
    .maybeSingle();
  return (data as PublicStore | null) ?? null;
}

export async function getStoreListings(orgId: string): Promise<PublicListing[]> {
  const { data } = await publicClient()
    .from('products')
    .select('id, name, title_ar, brand, category, base_price, images, slug, short_id, org_id')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(48);
  return (data ?? []) as PublicListing[];
}

export async function getProductByShortId(shortId: string): Promise<
  (PublicListing & { store: PublicStore | null; condition?: string | null }) | null
> {
  const { data } = await publicClient()
    .from('products')
    .select(
      'id, name, title_ar, brand, category, base_price, images, slug, short_id, org_id, description, description_ar'
    )
    .eq('short_id', shortId)
    .maybeSingle();
  if (!data) return null;
  const { data: org } = await publicClient()
    .from('organizations')
    .select('id, slug, name, name_ar, logo_url, bio, bio_ar')
    .eq('id', data.org_id)
    .maybeSingle();
  return { ...(data as PublicListing), store: (org as PublicStore | null) ?? null };
}

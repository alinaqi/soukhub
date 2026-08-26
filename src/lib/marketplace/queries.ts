import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';

/**
 * Public (anon) data access for the buyer surface. RLS + column grants expose
 * only published stores/listings and buyer-safe columns (ADR 0009, hardening
 * migration) — safe to call without a session, cacheable by ISR.
 *
 * Errors are THROWN, never swallowed: a transient outage must fail the render
 * (and keep the last ISR copy) rather than bake a 404 into the cache.
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

export const getStoreBySlug = cache(async (slug: string): Promise<PublicStore | null> => {
  const { data, error } = await publicClient()
    .from('organizations')
    .select('id, slug, name, name_ar, logo_url, bio, bio_ar')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return (data as PublicStore | null) ?? null;
});

export async function getStoreListings(orgId: string): Promise<PublicListing[]> {
  const { data, error } = await publicClient()
    .from('products')
    .select('id, name, title_ar, brand, category, base_price, images, slug, short_id, org_id')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(48);
  if (error) throw error;
  return (data ?? []) as PublicListing[];
}

/**
 * Deduped with React cache() so generateMetadata + the page render share one
 * lookup per request instead of doubling the round trips.
 */
export const getProductByShortId = cache(
  async (
    shortId: string
  ): Promise<(PublicListing & { store: PublicStore | null; condition?: string | null }) | null> => {
    const { data, error } = await publicClient()
      .from('products')
      .select(
        'id, name, title_ar, brand, category, base_price, images, slug, short_id, org_id, description, description_ar'
      )
      .eq('short_id', shortId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const { data: org, error: orgError } = await publicClient()
      .from('organizations')
      .select('id, slug, name, name_ar, logo_url, bio, bio_ar')
      .eq('id', data.org_id)
      .maybeSingle();
    if (orgError) throw orgError;
    return { ...(data as PublicListing), store: (org as PublicStore | null) ?? null };
  }
);

// ------------------------------------------------------------------
// External reference catalog (ADR 0016) — market data that fills
// discovery and powers trade-in pricing. Clearly badged in the UI.
// ------------------------------------------------------------------
export interface PublicCatalogItem {
  id: string;
  title: string;
  title_ar: string | null;
  brand: string | null;
  model: string | null;
  category: string | null;
  condition: string | null;
  price: number | null;
  currency: string;
  images: string[] | null;
  source: 'amazon' | 'cartlow' | 'revibe';
  url: string;
  slug?: string | null;
  short_id?: string | null;
}

export async function searchCatalog(filters: SearchFilters): Promise<PublicCatalogItem[]> {
  const { data, error } = await publicClient().rpc('search_catalog', {
    p_query: filters.q ?? '',
    p_brand: filters.brand ?? null,
    p_category: filters.category ?? null,
    p_min_price: filters.minPrice ?? null,
    p_max_price: filters.maxPrice ?? null,
    p_limit: filters.limit ?? 12,
    p_offset: filters.offset ?? 0,
  });
  if (error) throw error;
  return (data ?? []) as PublicCatalogItem[];
}

export async function getLatestCatalog(limit = 8): Promise<PublicCatalogItem[]> {
  return searchCatalog({ limit });
}

const CATALOG_COLS =
  'id, title, title_ar, brand, model, category, condition, price, currency, images, source, url, slug, short_id';

export const getCatalogItemById = cache(async (id: string): Promise<PublicCatalogItem | null> => {
  const { data, error } = await publicClient()
    .from('catalog_products')
    .select(CATALOG_COLS)
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return (data as PublicCatalogItem | null) ?? null;
});

export const getCatalogItemByShortId = cache(
  async (shortId: string): Promise<PublicCatalogItem | null> => {
    const { data, error } = await publicClient()
      .from('catalog_products')
      .select(CATALOG_COLS)
      .eq('short_id', shortId)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    return (data as PublicCatalogItem | null) ?? null;
  }
);

/** Distinct brands across active catalog + published listings (filter autocomplete). */
export const getKnownBrands = cache(async (): Promise<string[]> => {
  const { data } = await publicClient()
    .from('catalog_products')
    .select('brand')
    .eq('is_active', true)
    .not('brand', 'is', null)
    .limit(400);
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const b = (row.brand as string).trim();
    if (b) counts.set(b, (counts.get(b) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([b]) => b).slice(0, 24);
});

/** Similar devices for product pages: same category, comparable price. */
export async function getSimilarItems(opts: {
  category: string | null;
  price: number | null;
  excludeListingId?: string;
  excludeCatalogId?: string;
}): Promise<{ listings: PublicListing[]; catalog: PublicCatalogItem[] }> {
  const band = opts.price
    ? { minPrice: Math.floor(opts.price * 0.55), maxPrice: Math.ceil(opts.price * 1.6) }
    : {};
  const [listings, catalog] = await Promise.all([
    searchListings({ category: opts.category ?? undefined, ...band, limit: 8 }).catch(
      () => [] as PublicListing[]
    ),
    searchCatalog({ category: opts.category ?? undefined, ...band, limit: 8 }).catch(
      () => [] as PublicCatalogItem[]
    ),
  ]);
  return {
    listings: listings.filter((l) => l.id !== opts.excludeListingId).slice(0, 4),
    catalog: catalog.filter((c) => c.id !== opts.excludeCatalogId).slice(0, 4),
  };
}

// ------------------------------------------------------------------
// Provider directory (ADR 0017)
// ------------------------------------------------------------------
export interface PublicProvider {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  website?: string | null;
  address: string | null;
  area: string | null;
  emirate: string | null;
  lat: number | null;
  lng: number | null;
  google_rating: number | null;
  google_review_count: number | null;
  image_url: string | null;
  hours?: Record<string, unknown> | null;
  claimed_org_id?: string | null;
  google_reviews?: Array<{ author: string; stars: number | null; text: string; date: string | null }>;
  distance_km?: number;
}

export async function listProviders(limit = 200): Promise<PublicProvider[]> {
  const { data, error } = await publicClient()
    .from('providers')
    .select('id, slug, name, phone, whatsapp, address, area, emirate, lat, lng, google_rating, google_review_count, image_url, claimed_org_id')
    .eq('is_active', true)
    .order('google_review_count', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as PublicProvider[];
}

export const getProviderBySlug = cache(async (slug: string): Promise<PublicProvider | null> => {
  const { data, error } = await publicClient()
    .from('providers')
    .select('id, slug, name, phone, whatsapp, website, address, area, emirate, lat, lng, google_rating, google_review_count, image_url, hours, claimed_org_id, google_reviews')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return (data as PublicProvider | null) ?? null;
});

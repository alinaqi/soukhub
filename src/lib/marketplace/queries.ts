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

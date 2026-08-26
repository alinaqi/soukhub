import { createClient } from '@supabase/supabase-js';
import { productReviewKey } from './gemini';

/**
 * Batch-read CACHED ratings for card grids (home/search). Never triggers a
 * Gemini fetch — cards show stars only once a product family has been rated
 * (detail-page visits and the warm script fill the cache).
 */

export interface CachedRating {
  rating: number;
  review_count: number | null;
}

function anon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function getCachedRatings(
  items: Array<{ brand: string | null; title: string }>
): Promise<Map<string, CachedRating>> {
  const keys = [...new Set(items.map((i) => productReviewKey(i.brand, i.title)))].filter(
    (k) => k !== 'unknown'
  );
  const map = new Map<string, CachedRating>();
  if (keys.length === 0) return map;
  const { data } = await anon()
    .from('product_reviews')
    .select('product_key, rating, review_count')
    .in('product_key', keys)
    .not('rating', 'is', null);
  for (const row of data ?? []) {
    map.set(row.product_key, {
      rating: Number(row.rating),
      review_count: row.review_count,
    });
  }
  return map;
}

/** Cached-only single-family lookup (fast; used for JSON-LD rich snippets). */
export async function getCachedRatingFor(
  brand: string | null,
  title: string
): Promise<CachedRating | null> {
  const map = await getCachedRatings([{ brand, title }]);
  return map.get(productReviewKey(brand, title)) ?? null;
}

/** Attach a cached rating (when present) to each item, non-destructively. */
export function attachRating<T extends { brand: string | null }>(
  items: Array<T & { name?: string; title?: string }>,
  ratings: Map<string, CachedRating>
): Array<T & { rating?: number; review_count?: number | null }> {
  return items.map((item) => {
    const title = (item as { name?: string; title?: string }).name ?? (item as { title?: string }).title ?? '';
    const hit = ratings.get(productReviewKey(item.brand, title));
    return hit ? { ...item, rating: hit.rating, review_count: hit.review_count } : item;
  });
}

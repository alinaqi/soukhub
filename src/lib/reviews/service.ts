import { createClient } from '@supabase/supabase-js';
import { fetchWebReviews, productReviewKey, type ProductReviewData } from './gemini';

/** DB-cached review lookup: fetch from Gemini at most once a week per family. */

const FRESH_DAYS = 7;

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function getProductReviews(
  brand: string | null,
  title: string
): Promise<ProductReviewData | null> {
  const key = productReviewKey(brand, title);
  if (key === 'unknown') return null;
  const db = svc();

  const { data: cached } = await db
    .from('product_reviews')
    .select('rating, review_count, summary, quotes, fetched_at')
    .eq('product_key', key)
    .maybeSingle();

  if (cached) {
    const age = Date.now() - new Date(cached.fetched_at).getTime();
    if (age < FRESH_DAYS * 24 * 3600 * 1000) {
      return {
        rating: cached.rating != null ? Number(cached.rating) : null,
        review_count: cached.review_count,
        summary: cached.summary,
        quotes: Array.isArray(cached.quotes) ? cached.quotes : [],
      };
    }
  }

  const fresh = await fetchWebReviews(`${brand ?? ''} ${title}`.trim()).catch(() => null);
  if (!fresh) {
    // stale cache beats nothing
    return cached
      ? {
          rating: cached.rating != null ? Number(cached.rating) : null,
          review_count: cached.review_count,
          summary: cached.summary,
          quotes: Array.isArray(cached.quotes) ? cached.quotes : [],
        }
      : null;
  }

  await db
    .from('product_reviews')
    .upsert(
      {
        product_key: key,
        rating: fresh.rating,
        review_count: fresh.review_count,
        summary: fresh.summary,
        quotes: fresh.quotes,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: 'product_key' }
    );
  return fresh;
}

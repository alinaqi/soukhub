import { getTranslations } from 'next-intl/server';
import { Star, Quote } from 'lucide-react';
import { getProductReviews } from '@/lib/reviews/service';

/** Star row with fractional fill (server-rendered). */
function Stars({ rating }: { rating: number }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span className="relative inline-flex" aria-label={`${rating} out of 5`}>
      <span className="flex text-border">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className="h-5 w-5 fill-current" aria-hidden />
        ))}
      </span>
      <span className="absolute inset-0 overflow-hidden text-accent" style={{ width: `${pct}%` }}>
        <span className="flex">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="h-5 w-5 shrink-0 fill-current" aria-hidden />
          ))}
        </span>
      </span>
    </span>
  );
}

/**
 * Web-review intelligence for a product family: star score, consensus
 * summary and short attributed quotes (Gemini + Search grounding, DB-cached).
 */
export async function ReviewsSection({
  brand,
  title,
  locale,
}: {
  brand: string | null;
  title: string;
  locale: string;
}) {
  const reviews = await getProductReviews(brand, title).catch(() => null);
  if (!reviews || (reviews.rating == null && reviews.quotes.length === 0)) return null;
  const t = await getTranslations({ locale, namespace: 'product' });

  return (
    <section className="mt-10 rounded-2xl border border-border bg-surface-warm p-6">
      <h2 className="text-lg font-semibold">{t('reviewsTitle')}</h2>

      {reviews.rating != null && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Stars rating={reviews.rating} />
          <span className="text-2xl font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {reviews.rating.toFixed(1)}
          </span>
          {reviews.review_count != null && (
            <span className="text-sm text-muted-foreground">
              {t('basedOn', { count: reviews.review_count.toLocaleString('en-AE') })}
            </span>
          )}
        </div>
      )}

      {reviews.summary && (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {reviews.summary}
        </p>
      )}

      {reviews.quotes.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {reviews.quotes.map((quote, i) => (
            <figure key={i} className="rounded-xl border border-border bg-card p-4">
              <Quote className="h-4 w-4 text-primary/50" aria-hidden />
              <blockquote className="mt-2 text-sm leading-relaxed">“{quote.text}”</blockquote>
              <figcaption className="mt-2 text-xs font-medium text-muted-foreground">
                — {quote.source}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">{t('reviewsNote')}</p>
    </section>
  );
}

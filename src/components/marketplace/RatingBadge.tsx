import { Star } from 'lucide-react';

/** Compact star row for product cards (cached web-review score). */
export function RatingBadge({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount?: number | null;
}) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span className="flex items-center gap-1" aria-label={`${rating} out of 5`}>
      <span className="relative inline-flex">
        <span className="flex text-border">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-current" aria-hidden />
          ))}
        </span>
        <span
          className="absolute inset-0 overflow-hidden text-accent"
          style={{ width: `${pct}%` }}
        >
          <span className="flex">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden />
            ))}
          </span>
        </span>
      </span>
      <span className="text-xs font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {rating.toFixed(1)}
      </span>
      {reviewCount != null && (
        <span className="text-[11px] text-muted-foreground">({reviewCount.toLocaleString('en-AE')})</span>
      )}
    </span>
  );
}

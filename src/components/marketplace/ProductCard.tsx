import { useLocale } from 'next-intl';
import { ImageOff } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { formatAED, productPath } from '@/lib/marketplace/format';
import { RatingBadge } from './RatingBadge';
import type { PublicListing } from '@/lib/marketplace/queries';

/** Clean-Souk product card: image / two-line title / bold price / store line. */
export function ProductCard({ listing }: { listing: PublicListing & { rating?: number; review_count?: number | null } }) {
  const locale = useLocale();
  const title = locale === 'ar' && listing.title_ar ? listing.title_ar : listing.name;
  const image = Array.isArray(listing.images) ? (listing.images[0] as string | undefined) : undefined;

  return (
    <Link
      href={productPath(listing.slug, listing.short_id)}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary"
    >
      <div className="relative aspect-square bg-muted">
        {image ? (
          // Arbitrary seller/marketplace CDN hosts — served directly
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8" aria-hidden />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium group-hover:text-primary">{title}</h3>
        {listing.rating != null && (
          <RatingBadge rating={listing.rating} reviewCount={listing.review_count} />
        )}
        {listing.base_price != null && (
          <p className="text-base font-bold text-accent">
            {formatAED(Number(listing.base_price), locale)}
          </p>
        )}
        {listing.store_name && (
          <p className="mt-auto truncate text-xs text-muted-foreground">{listing.store_name}</p>
        )}
      </div>
    </Link>
  );
}

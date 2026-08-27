import { MapPin, Store } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ProviderRating } from '@/components/marketplace/ProvidersDirectoryClient';
import type { PublicProvider } from '@/lib/marketplace/queries';

/** Compact shop card for the directory grid and "nearby shops" strip. */
export function ProviderCard({ provider }: { provider: PublicProvider }) {
  const area = [provider.area, provider.emirate].filter(Boolean).join(', ');
  const km = provider.distance_km != null && isFinite(provider.distance_km)
    ? `${provider.distance_km.toFixed(1)} km`
    : null;

  return (
    <Link
      href={`/providers/${provider.slug}`}
      className="group rounded-xl border border-border bg-card p-3 transition hover:border-primary hover:shadow-sm"
    >
      <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
        {provider.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={provider.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <Store className="h-5 w-5" aria-hidden />
        )}
      </span>
      <span className="mt-2 line-clamp-2 block text-sm font-medium leading-snug group-hover:text-primary">
        {provider.name}
      </span>
      <span className="mt-1 block">
        <ProviderRating rating={provider.google_rating} count={provider.google_review_count} />
      </span>
      <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3 shrink-0" aria-hidden />
        <span className="truncate">{km ? `${km} · ${area}` : area}</span>
      </span>
    </Link>
  );
}

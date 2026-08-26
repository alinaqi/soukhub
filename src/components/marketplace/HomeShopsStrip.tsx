'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, MapPin, Store } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { loadStoredLocation, type DeliveryLocation } from '@/lib/delivery-location';
import { ProviderRating } from '@/components/marketplace/ProvidersDirectoryClient';
import type { PublicProvider } from '@/lib/marketplace/queries';

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Home strip: the shops (providers = sellers) closest to the saved
 * "Deliver to" location, falling back to top-rated across the UAE. */
export function HomeShopsStrip({ providers }: { providers: PublicProvider[] }) {
  const t = useTranslations('home');
  const [place, setPlace] = useState<DeliveryLocation | null>(null);

  useEffect(() => {
    const stored = loadStoredLocation();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe read of localStorage
    if (stored) setPlace(stored);
  }, []);

  const lat = place?.lat ?? null;
  const lng = place?.lng ?? null;

  const rows = useMemo(() => {
    if (lat == null || lng == null) return providers.slice(0, 6);
    return [...providers]
      .map((p) => ({
        ...p,
        distance_km:
          p.lat != null && p.lng != null
            ? haversineKm(lat, lng, Number(p.lat), Number(p.lng))
            : Number.POSITIVE_INFINITY,
      }))
      .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0))
      .slice(0, 6);
  }, [providers, lat, lng]);

  const located = lat != null && lng != null;

  if (rows.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {place?.label ? t('topShopsIn', { location: place.label }) : t('topShops')}
        </h2>
        <Link
          href="/providers"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          {t('allShops')}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {rows.map((p) => (
          <Link
            key={p.id}
            href={`/providers/${p.slug}`}
            className="group rounded-xl border border-border bg-card p-3 transition hover:border-primary hover:shadow-sm"
          >
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <Store className="h-5 w-5" aria-hidden />
              )}
            </span>
            <span className="mt-2 line-clamp-2 block text-sm font-medium leading-snug group-hover:text-primary">
              {p.name}
            </span>
            <span className="mt-1 block">
              <ProviderRating rating={p.google_rating} count={p.google_review_count} />
            </span>
            <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">
                {located && isFinite(p.distance_km ?? Infinity)
                  ? t('kmAway', { km: (p.distance_km as number).toFixed(1) })
                  : [p.area, p.emirate].filter(Boolean).join(', ')}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { loadStoredLocation } from '@/lib/delivery-location';
import { MapPin, Phone, MessageCircle, Star, LocateFixed, Store, BadgeCheck } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { PublicProvider } from '@/lib/marketplace/queries';

const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)) * 10) / 10;
}

export function ProviderRating({ rating, count }: { rating: number | null; count: number | null }) {
  const t = useTranslations('providers');
  if (rating == null) return null;
  return (
    <span className="flex items-center gap-1 text-sm">
      <Star className="h-4 w-4 fill-accent text-accent" aria-hidden />
      <span className="font-semibold">{Number(rating).toFixed(1)}</span>
      {count != null && <span className="text-xs text-muted-foreground">{t('reviews', { count })}</span>}
    </span>
  );
}

const EMIRATE_OPTIONS = new Set([
  'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain',
]);

export function ProvidersDirectoryClient({
  providers,
  initialEmirate,
}: {
  providers: PublicProvider[];
  initialEmirate?: string;
}) {
  const t = useTranslations('providers');
  const [query, setQuery] = useState('');
  const [emirate, setEmirate] = useState(
    initialEmirate && EMIRATE_OPTIONS.has(initialEmirate) ? initialEmirate : 'all'
  );
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [kind, setKind] = useState<'all' | 'mobile' | 'computer'>('all');

  // A saved "Deliver to" location with coordinates sorts the directory by
  // distance immediately, Talabat-style
  useEffect(() => {
    const stored = loadStoredLocation();
    if (stored?.lat != null && stored?.lng != null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe read of localStorage
      setMe({ lat: stored.lat, lng: stored.lng });
    }
  }, []);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        setLocationError(false);
      },
      () => {
        setLocationError(true);
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const isComputer = (p: PublicProvider) =>
      /computer|laptop|pc\b/i.test(`${p.category ?? ''} ${p.name}`);
    let rows = providers.filter((p) => {
      if (emirate !== 'all' && p.emirate !== emirate) return false;
      if (kind === 'computer' && !isComputer(p)) return false;
      if (kind === 'mobile' && isComputer(p)) return false;
      if (!q) return true;
      return `${p.name} ${p.area ?? ''} ${p.address ?? ''} ${p.category ?? ''}`.toLowerCase().includes(q);
    });
    if (me) {
      rows = rows
        .map((p) =>
          p.lat != null && p.lng != null
            ? { ...p, distance_km: haversineKm(me.lat, me.lng, Number(p.lat), Number(p.lng)) }
            : p
        )
        .sort((a, b) => (a.distance_km ?? 1e9) - (b.distance_km ?? 1e9));
    }
    return rows;
  }, [providers, query, emirate, kind, me]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{t('title')}</h1>
      <p className="mt-1 max-w-2xl text-muted-foreground">{t('subtitle')}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <select
          value={emirate}
          onChange={(e) => setEmirate(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="all">{t('allEmirates')}</option>
          {EMIRATES.map((em) => (
            <option key={em} value={em}>{em}</option>
          ))}
        </select>
        <button
          onClick={locate}
          disabled={locating}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          <LocateFixed className="h-4 w-4" aria-hidden />
          {locating ? t('locating') : t('nearMe')}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {([['all', t('kindAll')], ['mobile', t('kindMobile')], ['computer', t('kindComputer')]] as const).map(
          ([value, label]) => (
            <button
              key={value}
              onClick={() => setKind(value)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                kind === value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-foreground'
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>
      {locationError && (
        <p className="mt-2 text-sm text-warning">{t('locationDenied')}</p>
      )}

      {list.length === 0 ? (
        <p className="mt-10 rounded-xl border border-border bg-surface-warm p-10 text-center text-muted-foreground">
          {t('noResults')}
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <div key={p.id} className="flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary">
              <Link href={`/providers/${p.slug}`} className="group flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-5 w-5" aria-hidden />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 font-semibold leading-snug group-hover:text-primary">
                    {p.name}
                    {p.claimed_org_id && (
                      <BadgeCheck className="ms-1.5 inline h-4 w-4 text-primary" aria-label={t('claimedBadge')} />
                    )}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                    <span className="truncate">{[p.area, p.emirate].filter(Boolean).join(', ')}</span>
                  </span>
                </span>
              </Link>
              <div className="mt-3 flex items-center justify-between">
                <ProviderRating rating={p.google_rating} count={p.google_review_count} />
                {p.distance_km != null && (
                  <span className="text-xs font-medium text-primary">
                    {t('kmAway', { km: p.distance_km })}
                  </span>
                )}
              </div>
              <div className="mt-4 flex gap-2 border-t border-border pt-3">
                {p.phone && (
                  <a
                    href={`tel:${p.phone.replace(/\s/g, '')}`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden />
                    {t('call')}
                  </a>
                )}
                {p.whatsapp && (
                  <a
                    href={`https://wa.me/${p.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                    {t('whatsapp')}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

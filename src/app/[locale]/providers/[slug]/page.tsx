import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MapPin, Phone, MessageCircle, Store, Navigation } from 'lucide-react';
import { PublicHeader } from '@/components/marketplace/PublicHeader';
import { ProviderRequestClient } from '@/components/marketplace/ProviderRequestClient';
import { ProviderRating } from '@/components/marketplace/ProvidersDirectoryClient';
import { getProviderBySlug } from '@/lib/marketplace/queries';
import { safeJsonLd } from '@/lib/marketplace/jsonld';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const provider = await getProviderBySlug(slug).catch(() => null);
  if (!provider) return {};
  return {
    title: provider.name,
    description: [provider.area, provider.emirate, provider.phone].filter(Boolean).join(' · '),
    alternates: {
      canonical: `/providers/${slug}`,
      languages: { en: `/providers/${slug}`, ar: `/ar/providers/${slug}` },
    },
  };
}

export default async function ProviderPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const provider = await getProviderBySlug(slug);
  if (!provider) notFound();

  const t = await getTranslations({ locale, namespace: 'providers' });
  const hours = (provider.hours as { openingHours?: Array<{ day?: string; hours?: string }> } | null)
    ?.openingHours;
  const mapsUrl = provider.lat != null
    ? `https://www.google.com/maps/search/?api=1&query=${provider.lat},${provider.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ' ' + (provider.address ?? ''))}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MobilePhoneStore',
    name: provider.name,
    ...(provider.address ? { address: provider.address } : {}),
    ...(provider.phone ? { telephone: provider.phone } : {}),
    ...(provider.lat != null
      ? { geo: { '@type': 'GeoCoordinates', latitude: provider.lat, longitude: provider.lng } }
      : {}),
    ...(provider.google_rating != null && provider.google_review_count
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(provider.google_rating),
            reviewCount: provider.google_review_count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="flex items-start gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
            {provider.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={provider.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Store className="h-7 w-7" aria-hidden />
            )}
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight">{provider.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              {[provider.address, provider.emirate].filter(Boolean).join(' — ')}
            </p>
            <div className="mt-2">
              <ProviderRating rating={provider.google_rating} count={provider.google_review_count} />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {provider.phone && (
            <a
              href={`tel:${provider.phone.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              <Phone className="h-4 w-4" aria-hidden />
              {t('call')} · {provider.phone}
            </a>
          )}
          {provider.whatsapp && (
            <a
              href={`https://wa.me/${provider.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              {t('whatsapp')}
            </a>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
          >
            <Navigation className="h-4 w-4" aria-hidden />
            {t('directions')}
          </a>
        </div>

        {Array.isArray(hours) && hours.length > 0 && (
          <details className="mt-6 rounded-xl border border-border bg-card p-4">
            <summary className="cursor-pointer text-sm font-semibold">{t('hoursTitle')}</summary>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {hours.map((h, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span>{h.day}</span>
                  <span>{h.hours}</span>
                </li>
              ))}
            </ul>
          </details>
        )}

        <ProviderRequestClient providerId={provider.id} />
      </main>
    </div>
  );
}

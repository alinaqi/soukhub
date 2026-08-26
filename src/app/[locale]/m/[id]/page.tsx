import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PublicHeader } from '@/components/marketplace/PublicHeader';
import { CatalogRequestClient } from '@/components/marketplace/CatalogRequestClient';
import { ReviewsSection } from '@/components/marketplace/ReviewsSection';
import { SimilarSection } from '@/components/marketplace/SimilarSection';
import { localePath, localeAlternates } from '@/i18n/routing';
import {
  getCatalogItemById,
  getCatalogItemByShortId,
  type PublicCatalogItem,
} from '@/lib/marketplace/queries';
import { parseSlugId, catalogPath, hoursSince } from '@/lib/marketplace/format';
import { productJsonLd, safeJsonLd } from '@/lib/marketplace/jsonld';
import { Breadcrumbs } from '@/components/marketplace/Breadcrumbs';
import { CategoryChips } from '@/components/marketplace/CategoryChips';
import { getCachedRatingFor } from '@/lib/reviews/cached';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

async function resolveItem(param: string): Promise<PublicCatalogItem | null> {
  if (UUID_RE.test(param)) return getCatalogItemById(param);
  const parsed = parseSlugId(param);
  if (!parsed) return null;
  return getCatalogItemByShortId(parsed.shortId);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const item = await resolveItem(id).catch(() => null);
  if (!item) return {};
  const title = locale === 'ar' && item.title_ar ? item.title_ar : item.title;
  const image = Array.isArray(item.images) ? (item.images[0] as string | undefined) : undefined;
  const path = catalogPath(item);
  const description = [
    item.brand,
    item.condition?.replace('_', ' '),
    item.price ? `AED ${item.price}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: localeAlternates(path),
    },
    openGraph: {
      title,
      description,
      type: 'website',
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
    },
  };
}

export default async function CatalogItemPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const item = await resolveItem(id);
  if (!item) notFound();

  // Canonical URL: uuid links and stale slugs 308 to /m/{slug}-{shortId}
  const canonical = catalogPath(item);
  if (item.slug && item.short_id && `/m/${id}` !== canonical) {
    permanentRedirect(localePath(locale, canonical));
  }

  const t = await getTranslations({ locale, namespace: 'catalog' });
  const title = locale === 'ar' && item.title_ar ? item.title_ar : item.title;
  const image = Array.isArray(item.images) ? (item.images[0] as string | undefined) : undefined;

  const cachedRating = await getCachedRatingFor(item.brand, item.title).catch(() => null);
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://soukhub.vercel.app';
  const jsonLd = item.price != null
    ? productJsonLd({
        name: title,
        images: image ? [image] : [],
        price: Number(item.price),
        condition: item.condition,
        storeName: 'SoukHub',
        url: `${base}${localePath(locale, canonical)}`,
        aggregateRating:
          cachedRating && cachedRating.review_count
            ? { rating: cachedRating.rating, count: cachedRating.review_count }
            : null,
      })
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      )}
      <PublicHeader />
      <div className="mx-auto max-w-4xl space-y-3 px-4 pt-5 sm:px-6">
        <Breadcrumbs
          locale={locale}
          category={item.category}
          title={title}
          currentPath={canonical}
        />
        <CategoryChips locale={locale} active={item.category} />
        {item.scraped_at && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t('verifiedAgo', { hours: hoursSince(item.scraped_at) })}
          </p>
        )}
      </div>
      <CatalogRequestClient
        item={{
          id: item.id,
          title,
          price: item.price != null ? Number(item.price) : null,
          condition: item.condition,
          image: image ?? null,
          sourceName: t(`sources.${item.source}`),
        }}
      />
      <div className="mx-auto max-w-4xl px-4 pb-12 sm:px-6">
        <Suspense fallback={null}>
          <ReviewsSection brand={item.brand} title={item.title} locale={locale} />
        </Suspense>
        <Suspense fallback={null}>
          <SimilarSection
            category={item.category}
            price={item.price != null ? Number(item.price) : null}
            locale={locale}
            excludeCatalogId={item.id}
          />
        </Suspense>
      </div>
    </div>
  );
}

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Store, Truck, Banknote, MessageCircle, ShoppingBag } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PublicHeader } from '@/components/marketplace/PublicHeader';
import { ReviewsSection } from '@/components/marketplace/ReviewsSection';
import { SimilarSection } from '@/components/marketplace/SimilarSection';
import { getProductByShortId } from '@/lib/marketplace/queries';
import { formatAED, parseSlugId, productPath, whatsAppOrderLink } from '@/lib/marketplace/format';
import { productJsonLd, breadcrumbJsonLd, safeJsonLd } from '@/lib/marketplace/jsonld';
import { getCachedRatingFor } from '@/lib/reviews/cached';

export const revalidate = 60;

function baseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slugId: string }>;
}): Promise<Metadata> {
  const { locale, slugId } = await params;
  const parsed = parseSlugId(slugId);
  if (!parsed) return {};
  const product = await getProductByShortId(parsed.shortId);
  if (!product) return {};
  const title = locale === 'ar' && product.title_ar ? product.title_ar : product.name;
  const description =
    (locale === 'ar' && product.description_ar ? product.description_ar : product.description) ??
    undefined;
  const path = productPath(product.slug, product.short_id);
  const image = Array.isArray(product.images) ? (product.images[0] as string | undefined) : undefined;
  return {
    title,
    description,
    alternates: { languages: { en: path, ar: `/ar${path}` } },
    openGraph: {
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slugId: string }>;
}) {
  const { locale, slugId } = await params;
  setRequestLocale(locale);
  const parsed = parseSlugId(slugId);
  if (!parsed) notFound();

  const product = await getProductByShortId(parsed.shortId);
  if (!product) notFound();

  // Canonical redirect when the slug half changed (e.g. renamed listing)
  const canonicalPath = productPath(product.slug, product.short_id);
  if (parsed.slug !== product.slug) {
    permanentRedirect(locale === 'ar' ? `/ar${canonicalPath}` : canonicalPath);
  }

  const t = await getTranslations({ locale, namespace: 'product' });
  const tc = await getTranslations({ locale, namespace: 'common' });

  const title = locale === 'ar' && product.title_ar ? product.title_ar : product.name;
  const description =
    locale === 'ar' && product.description_ar ? product.description_ar : product.description;
  const images = (Array.isArray(product.images) ? product.images : []) as string[];
  const storeName =
    locale === 'ar' && product.store?.name_ar ? product.store.name_ar : product.store?.name;
  const url = `${baseUrl()}${locale === 'ar' ? '/ar' : ''}${canonicalPath}`;
  const price = Number(product.base_price ?? 0);

  // Cached web-review aggregate → Google rich-snippet stars in organic results
  const cachedRating = await getCachedRatingFor(product.brand, product.name).catch(() => null);

  // JSON-LD mirrors the visible localized content of THIS page (ar pages get
  // Arabic structured data; condition is omitted until listings carry one)
  const jsonLd = productJsonLd({
    name: title,
    description,
    images,
    price,
    storeName: (locale === 'ar' && product.store?.name_ar
      ? product.store.name_ar
      : product.store?.name) ?? 'SoukHub seller',
    url,
    aggregateRating:
      cachedRating && cachedRating.review_count
        ? { rating: cachedRating.rating, count: cachedRating.review_count }
        : null,
  });
  const breadcrumbs = breadcrumbJsonLd([
    { name: 'SoukHub', url: baseUrl() },
    ...(product.category
      ? [{ name: product.category, url: `${baseUrl()}/search?category=${product.category}` }]
      : []),
    { name: title, url },
  ]);

  const whatsappHref = whatsAppOrderLink(
    '', // seller contact number lands with checkout work (M2); wa.me without number opens share
    t('whatsappMessage', { product: title, url })
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbs) }}
      />
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:pb-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
            {images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[0]}
                alt={title}
                className="absolute inset-0 h-full w-full object-contain"
              />
            ) : (
              <span className="flex h-full items-center justify-center text-muted-foreground">
                <ShoppingBag className="h-12 w-12" aria-hidden />
              </span>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
            {product.brand && (
              <p className="mt-1 text-sm text-muted-foreground">{product.brand}</p>
            )}
            <p className="mt-4 text-3xl font-bold text-accent">{formatAED(price, locale)}</p>

            {/* Seller card */}
            {product.store && (
              <Link
                href={`/s/${product.store.slug}`}
                className="mt-6 flex items-center gap-3 rounded-xl border border-border p-4 hover:border-primary"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Store className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-xs text-muted-foreground">{t('soldBy')}</span>
                  <span className="font-semibold">{storeName}</span>
                </span>
                <span className="ms-auto text-sm font-medium text-primary">
                  {tc('viewStore')}
                </span>
              </Link>
            )}

            {/* Fulfillment facts */}
            <ul className="mt-6 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" aria-hidden />
                {t('delivery')}
              </li>
              <li className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-primary" aria-hidden />
                {t('codAvailable')}
              </li>
            </ul>

            {/* CTA (desktop) */}
            <div className="mt-8 hidden gap-3 lg:flex">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                <MessageCircle className="h-5 w-5" aria-hidden />
                {tc('orderOnWhatsApp')}
              </a>
              <Link
                href={`/checkout/${product.slug}-${product.short_id}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground hover:opacity-90"
              >
                {t('buyOnline')}
              </Link>
            </div>

            {description && (
              <section className="mt-8">
                <h2 className="font-semibold">{t('aboutItem')}</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </section>
            )}
          </div>
        </div>

        <Suspense fallback={null}>
          <ReviewsSection brand={product.brand} title={product.name} locale={locale} />
        </Suspense>
        <Suspense fallback={null}>
          <SimilarSection
            category={product.category}
            price={price || null}
            locale={locale}
            excludeListingId={product.id}
          />
        </Suspense>
      </main>

      {/* Sticky mobile buy bar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background p-3 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <span className="text-lg font-bold text-accent">{formatAED(price, locale)}</span>
          <Link
            href={`/checkout/${product.slug}-${product.short_id}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-semibold text-accent-foreground"
          >
            {t('buyOnline')}
          </Link>
        </div>
      </div>
    </div>
  );
}

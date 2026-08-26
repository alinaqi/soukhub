import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { HomeLanding } from '@/components/marketplace/HomeLanding';
import { getLatestListings, getLatestCatalog, searchCatalog, type PublicListing, type PublicCatalogItem } from '@/lib/marketplace/queries';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return {
    title: { absolute: t('metaTitle') },
    description: t('metaDescription'),
    alternates: { languages: { en: '/', ar: '/ar' } },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let listings: PublicListing[] = [];
  let catalog: PublicCatalogItem[] = [];
  let deals: PublicCatalogItem[] = [];
  try {
    let dealPool: PublicCatalogItem[] = [];
    [listings, dealPool] = await Promise.all([
      getLatestListings(8),
      searchCatalog({ maxPrice: 500, limit: 24 }),
    ]);
    // Round-robin across sources so the row shows the whole market
    const bySource = new Map<string, PublicCatalogItem[]>();
    for (const item of dealPool) {
      const list = bySource.get(item.source) ?? [];
      list.push(item);
      bySource.set(item.source, list);
    }
    const buckets = [...bySource.values()];
    for (let i = 0; deals.length < 4 && buckets.some((b) => b.length); i++) {
      const bucket = buckets[i % buckets.length];
      const next = bucket.shift();
      if (next) deals.push(next);
    }
  } catch {
    // The home page must render even if search is briefly unavailable;
    // the grid shows its empty state and ISR retries within a minute.
  }
  if (listings.length < 8) {
    try {
      catalog = await getLatestCatalog(8);
    } catch {
      // catalog is best-effort filler
    }
  }
  const bannerImage =
    listings.find((l) => Array.isArray(l.images) && l.images[0])?.images?.[0] ??
    deals.find((d) => Array.isArray(d.images) && d.images[0])?.images?.[0] ??
    null;

  return (
    <HomeLanding
      listings={listings}
      catalog={catalog}
      deals={deals}
      bannerImage={bannerImage}
      searchAction={locale === 'ar' ? '/ar/search' : '/search'}
    />
  );
}

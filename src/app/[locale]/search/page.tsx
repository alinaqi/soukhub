import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PublicHeader } from '@/components/marketplace/PublicHeader';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { searchListings, searchCatalog, getKnownBrands, type PublicCatalogItem } from '@/lib/marketplace/queries';
import { SearchFiltersPanel } from '@/components/marketplace/SearchFiltersPanel';
import { getCachedRatings, attachRating } from '@/lib/reviews/cached';
import { CatalogCard } from '@/components/marketplace/CatalogCard';

type SearchParams = Promise<{
  q?: string;
  brand?: string;
  category?: string;
  min?: string;
  max?: string;
}>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'search' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      languages: { en: '/search', ar: '/ar/search' },
    },
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'search' });

  const query = sp.q?.trim() ?? '';
  const filterArgs = {
    q: query,
    brand: sp.brand,
    category: sp.category,
    minPrice: sp.min ? Number(sp.min) : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
  };
  const [listings, knownBrands] = await Promise.all([
    searchListings({ ...filterArgs, limit: 36 }),
    getKnownBrands().catch(() => [] as string[]),
  ]);

  // Never an empty result: back-fill with badged market-catalog items (ADR 0016)
  let catalogItems: PublicCatalogItem[] = [];
  if (listings.length < 8) {
    try {
      catalogItems = await searchCatalog({ ...filterArgs, limit: 12 });
    } catch {
      // catalog is best-effort
    }
  }
  const tcat = await getTranslations({ locale, namespace: 'catalog' });

  let ratedListings = listings;
  let ratedCatalog = catalogItems;
  try {
    const ratings = await getCachedRatings([
      ...listings.map((l) => ({ brand: l.brand, title: l.name })),
      ...catalogItems.map((c) => ({ brand: c.brand, title: c.title })),
    ]);
    ratedListings = attachRating(listings, ratings);
    ratedCatalog = attachRating(catalogItems, ratings);
  } catch {
    // stars are enhancement only
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader defaultQuery={query} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Filters */}
          <aside className="lg:w-60 lg:shrink-0">
            <SearchFiltersPanel
              action={locale === 'ar' ? '/ar/search' : '/search'}
              brands={knownBrands}
              initial={{ q: query || undefined, brand: sp.brand, category: sp.category, min: sp.min, max: sp.max }}
            />
          </aside>

          {/* Results */}
          <section className="flex-1">
            <h1 className="text-xl font-bold">
              {query ? t('resultsFor', { query }) : t('allListings')}
            </h1>
            {listings.length === 0 && catalogItems.length === 0 ? (
              <p className="mt-8 rounded-xl border border-border bg-surface-warm p-8 text-center text-muted-foreground">
                {t('noResults')}
              </p>
            ) : (
              <>
                {listings.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                    {ratedListings.map((listing) => (
                      <ProductCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                )}
                {catalogItems.length > 0 && (
                  <div className="mt-10">
                    <h2 className="text-lg font-semibold">{tcat('fromMarket')}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{tcat('marketNote')}</p>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                      {ratedCatalog.map((item) => (
                        <CatalogCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

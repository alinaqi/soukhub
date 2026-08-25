import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PublicHeader } from '@/components/marketplace/PublicHeader';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { searchListings } from '@/lib/marketplace/queries';

export const revalidate = 60;

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
  const listings = await searchListings({
    q: query,
    brand: sp.brand,
    category: sp.category,
    minPrice: sp.min ? Number(sp.min) : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
    limit: 36,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader defaultQuery={query} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Filters */}
          <aside className="lg:w-56 lg:shrink-0">
            <form action="/search" className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              {query && <input type="hidden" name="q" value={query} />}
              <label className="text-sm">
                <span className="mb-1 block font-medium">{t('filters.brand')}</span>
                <input
                  name="brand"
                  defaultValue={sp.brand ?? ''}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">{t('filters.category')}</span>
                <input
                  name="category"
                  defaultValue={sp.category ?? ''}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">{t('filters.minPrice')}</span>
                <input
                  name="min"
                  type="number"
                  min="0"
                  defaultValue={sp.min ?? ''}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">{t('filters.maxPrice')}</span>
                <input
                  name="max"
                  type="number"
                  min="0"
                  defaultValue={sp.max ?? ''}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2"
                />
              </label>
              <div className="col-span-2 flex gap-2 lg:col-span-1">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
                >
                  {t('filters.apply')}
                </button>
                <Link
                  href="/search"
                  className="rounded-lg border border-border px-4 py-2 text-center text-sm font-medium hover:bg-muted"
                >
                  {t('filters.clear')}
                </Link>
              </div>
            </form>
          </aside>

          {/* Results */}
          <section className="flex-1">
            <h1 className="text-xl font-bold">
              {query ? t('resultsFor', { query }) : t('allListings')}
            </h1>
            {listings.length === 0 ? (
              <p className="mt-8 rounded-xl border border-border bg-surface-warm p-8 text-center text-muted-foreground">
                {t('noResults')}
              </p>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {listings.map((listing) => (
                  <ProductCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

import { getTranslations } from 'next-intl/server';
import { ProductCard } from './ProductCard';
import { CatalogCard } from './CatalogCard';
import { getSimilarItems } from '@/lib/marketplace/queries';

/** "Similar devices" — live listings first, market catalog fills the rest. */
export async function SimilarSection({
  category,
  price,
  locale,
  excludeListingId,
  excludeCatalogId,
}: {
  category: string | null;
  price: number | null;
  locale: string;
  excludeListingId?: string;
  excludeCatalogId?: string;
}) {
  const { listings, catalog } = await getSimilarItems({
    category,
    price,
    excludeListingId,
    excludeCatalogId,
  }).catch(() => ({ listings: [], catalog: [] }));
  const fillCount = Math.max(0, 4 - listings.length);
  const items = [...listings, ...catalog.slice(0, fillCount)];
  if (items.length === 0) return null;
  const t = await getTranslations({ locale, namespace: 'product' });

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">{t('similarTitle')}</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {listings.map((listing) => (
          <ProductCard key={listing.id} listing={listing} />
        ))}
        {catalog.slice(0, fillCount).map((item) => (
          <CatalogCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

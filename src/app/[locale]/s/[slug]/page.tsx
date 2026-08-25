import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Store } from 'lucide-react';
import { PublicHeader } from '@/components/marketplace/PublicHeader';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { getStoreBySlug, getStoreListings } from '@/lib/marketplace/queries';

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return {};
  const t = await getTranslations({ locale, namespace: 'store' });
  const name = locale === 'ar' && store.name_ar ? store.name_ar : store.name;
  return {
    title: name,
    description: t('metaDescription', { store: name }),
    alternates: {
      languages: { en: `/s/${slug}`, ar: `/ar/s/${slug}` },
    },
  };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const t = await getTranslations({ locale, namespace: 'store' });
  const listings = await getStoreListings(store.id);
  const name = locale === 'ar' && store.name_ar ? store.name_ar : store.name;
  const bio = locale === 'ar' && store.bio_ar ? store.bio_ar : store.bio;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-center gap-4 rounded-xl border border-border bg-surface-warm p-6">
          {store.logo_url ? (
            <Image
              src={store.logo_url}
              alt={name}
              width={64}
              height={64}
              className="h-16 w-16 rounded-xl object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Store className="h-7 w-7" aria-hidden />
            </span>
          )}
          <div>
            <h1 className="text-2xl font-bold">{name}</h1>
            {bio && <p className="mt-1 text-sm text-muted-foreground">{bio}</p>}
          </div>
        </header>

        <h2 className="mt-10 text-lg font-semibold">{t('listings')}</h2>
        {listings.length === 0 ? (
          <p className="mt-4 rounded-xl border border-border p-8 text-center text-muted-foreground">
            {t('noListings')}
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <ProductCard key={listing.id} listing={{ ...listing, store_name: name }} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { HomeLanding } from '@/components/marketplace/HomeLanding';
import { getLatestListings, type PublicListing } from '@/lib/marketplace/queries';

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
  try {
    listings = await getLatestListings(8);
  } catch {
    // The home page must render even if search is briefly unavailable;
    // the grid shows its empty state and ISR retries within a minute.
  }

  return (
    <HomeLanding
      listings={listings}
      searchAction={locale === 'ar' ? '/ar/search' : '/search'}
    />
  );
}

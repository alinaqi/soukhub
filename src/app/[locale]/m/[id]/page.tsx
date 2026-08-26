import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PublicHeader } from '@/components/marketplace/PublicHeader';
import { CatalogRequestClient } from '@/components/marketplace/CatalogRequestClient';
import { getCatalogItemById } from '@/lib/marketplace/queries';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return {};
  const item = await getCatalogItemById(id);
  if (!item) return {};
  const title = locale === 'ar' && item.title_ar ? item.title_ar : item.title;
  return { title, robots: { index: false } };
}

export default async function CatalogItemPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const item = await getCatalogItemById(id);
  if (!item) notFound();

  const t = await getTranslations({ locale, namespace: 'catalog' });
  const title = locale === 'ar' && item.title_ar ? item.title_ar : item.title;
  const image = Array.isArray(item.images) ? (item.images[0] as string | undefined) : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
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
    </div>
  );
}

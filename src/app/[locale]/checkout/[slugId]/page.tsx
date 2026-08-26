import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PublicHeader } from '@/components/marketplace/PublicHeader';
import { CheckoutClient } from '@/components/marketplace/CheckoutClient';
import { getProductByShortId } from '@/lib/marketplace/queries';
import { parseSlugId } from '@/lib/marketplace/format';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'checkout' });
  return { title: t('metaTitle'), robots: { index: false } };
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string; slugId: string }>;
}) {
  const { locale, slugId } = await params;
  setRequestLocale(locale);
  const parsed = parseSlugId(slugId);
  if (!parsed) notFound();
  const product = await getProductByShortId(parsed.shortId);
  if (!product || product.base_price == null) notFound();

  const title = locale === 'ar' && product.title_ar ? product.title_ar : product.name;
  const image = Array.isArray(product.images) ? (product.images[0] as string | undefined) : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <CheckoutClient
        product={{
          id: product.id,
          title,
          price: Number(product.base_price),
          image: image ?? null,
          storeName:
            (locale === 'ar' && product.store?.name_ar
              ? product.store.name_ar
              : product.store?.name) ?? null,
        }}
      />
    </div>
  );
}

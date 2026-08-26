import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { PublicHeader } from '@/components/marketplace/PublicHeader';
import { TradeInClient } from '@/components/marketplace/TradeInClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tradein' });
  return {
    title: { absolute: t('metaTitle') },
    description: t('metaDescription'),
    alternates: { languages: { en: '/trade-in', ar: '/ar/trade-in' } },
  };
}

export default async function TradeInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <TradeInClient />
    </div>
  );
}

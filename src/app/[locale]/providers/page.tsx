import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PublicHeader } from '@/components/marketplace/PublicHeader';
import { ProvidersDirectoryClient } from '@/components/marketplace/ProvidersDirectoryClient';
import { listProviders, type PublicProvider } from '@/lib/marketplace/queries';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'providers' });
  return {
    title: { absolute: t('metaTitle') },
    description: t('metaDescription'),
    alternates: { languages: { en: '/providers', ar: '/ar/providers' } },
  };
}

export default async function ProvidersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let providers: PublicProvider[] = [];
  try {
    providers = await listProviders(300);
  } catch {
    // directory renders its empty state
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <ProvidersDirectoryClient providers={providers} />
    </div>
  );
}

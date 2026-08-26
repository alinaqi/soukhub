import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { AssistantWidget } from '@/components/marketplace/AssistantWidget';
import { SiteFooter } from '@/components/marketplace/SiteFooter';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <NextIntlClientProvider>
      {children}
      <SiteFooter />
      <Suspense>
        <AssistantWidget />
      </Suspense>
    </NextIntlClientProvider>
  );
}

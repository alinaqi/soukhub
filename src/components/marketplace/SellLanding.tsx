import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import {
  Store,
  Sparkles,
  ShieldCheck,
  UserPlus,
  PackagePlus,
  Share2,
  ArrowRight,
  Percent,
} from 'lucide-react';
import NextLink from 'next/link';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from '@/components/marketplace/LocaleSwitcher';

const HOW_STEPS = [
  { key: 'how1', icon: UserPlus },
  { key: 'how2', icon: PackagePlus },
  { key: 'how3', icon: Share2 },
] as const;

const VALUE_KEYS = [
  { key: 'ai', icon: Sparkles },
  { key: 'store', icon: Store },
  { key: 'ops', icon: ShieldCheck },
] as const;

/** The seller pitch — moved off the consumer home page. Sellers sign up here. */
export function SellLanding() {
  const t = useTranslations('sell');
  const th = useTranslations('home');
  const tn = useTranslations('nav');
  const tc = useTranslations('common');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xl font-bold tracking-tight">{tc('brand')}</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Suspense>
              <LocaleSwitcher />
            </Suspense>
            <Link href="/" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">
              {tn('browse')}
            </Link>
            <NextLink
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              {tc('startSelling')}
            </NextLink>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-border bg-surface-warm">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t('heroTitle')}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{t('heroSubtitle')}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <NextLink
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                {t('cta')}
                <ArrowRight className="h-5 w-5 rtl:rotate-180" aria-hidden />
              </NextLink>
              <NextLink
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-4 font-medium hover:bg-muted"
              >
                {t('ctaSecondary')}
              </NextLink>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">{t('howTitle')}</h2>
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
          {HOW_STEPS.map(({ key, icon: Icon }, i) => (
            <div key={key} className="rounded-xl border border-border bg-card p-6 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <div className="mt-3 text-sm font-semibold text-primary">{i + 1}</div>
              <h3 className="mt-1 font-semibold">{t(`${key}Title`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(`${key}Text`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Value props (shared copy with home.seller.*) */}
      <section className="border-y border-border bg-surface-warm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">{th('sellerTitle')}</h2>
            <p className="mt-3 text-muted-foreground">{th('sellerSubtitle')}</p>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {VALUE_KEYS.map(({ key, icon: Icon }) => (
              <div key={key} className="rounded-xl border border-border bg-card p-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">{th(`seller.${key}Title`)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{th(`seller.${key}Text`)}</p>
              </div>
            ))}
          </div>

          {/* External marketplaces */}
          <div className="mt-12 rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold">{th('marketplacesTitle')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{th('marketplacesSubtitle')}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {['Amazon UAE', 'Cartlow', 'Revibe'].map((name) => (
                <div key={name} className="rounded-lg border border-border p-4 font-medium">
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing + CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Percent className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="mt-4 text-2xl font-bold">{t('commissionTitle')}</h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">{t('commissionText')}</p>
        <NextLink
          href="/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          {th('openStoreCta')}
          <ArrowRight className="h-5 w-5 rtl:rotate-180" aria-hidden />
        </NextLink>
        <p className="mt-3 text-sm text-muted-foreground">{th('commissionNote')}</p>
      </section>
    </div>
  );
}

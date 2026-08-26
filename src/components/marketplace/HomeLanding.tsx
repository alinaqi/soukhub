import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  Store,
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  Tablet,
  Gamepad2,
  ShieldCheck,
  Truck,
  MessageCircle,
  BadgeCheck,
  ArrowRight,
  CreditCard,
  Banknote,
} from 'lucide-react';
import NextLink from 'next/link';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from '@/components/marketplace/LocaleSwitcher';
import { ProductCard } from '@/components/marketplace/ProductCard';
import type { PublicListing, PublicCatalogItem } from '@/lib/marketplace/queries';
import { CatalogCard } from '@/components/marketplace/CatalogCard';

const CATEGORY_ICONS = [
  { key: 'phones', icon: Smartphone },
  { key: 'laptops', icon: Laptop },
  { key: 'tablets', icon: Tablet },
  { key: 'audio', icon: Headphones },
  { key: 'wearables', icon: Watch },
  { key: 'gaming', icon: Gamepad2 },
] as const;

const TRUST_ICONS = [
  { key: 'graded', icon: BadgeCheck },
  { key: 'pay', icon: CreditCard },
  { key: 'whatsapp', icon: MessageCircle },
  { key: 'seller', icon: Truck },
] as const;

/**
 * Consumer-first marketplace home. The seller pitch lives at /sell —
 * here buyers get search, categories and real listings above the fold.
 */
export function HomeLanding({
  listings,
  catalog = [],
  deals = [],
  bannerImage = null,
  searchAction,
}: {
  listings: PublicListing[];
  catalog?: PublicCatalogItem[];
  deals?: PublicCatalogItem[];
  bannerImage?: string | null;
  searchAction: string;
}) {
  const tcat = useTranslations('catalog');
  const t = useTranslations('home');
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
            <Link
              href="/trade-in"
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              {tn('tradeIn')}
            </Link>
            <Link
              href="/sell"
              className="rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
            >
              {tn('forSellers')}
            </Link>
            <NextLink
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              {tc('login')}
            </NextLink>
          </div>
        </div>
      </nav>

      {/* Hero: search-first */}
      <section className="border-b border-border bg-surface-warm">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="sr-only">{t('heroTitle')}</h1>

            <form action={searchAction} className="mx-auto mt-8 flex max-w-xl items-center gap-2" role="search">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  name="q"
                  placeholder={tc('searchPlaceholder')}
                  className="w-full rounded-lg border border-border bg-card py-3 ps-10 pe-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                {tc('search')}
              </button>
            </form>
          </div>

          {/* Categories */}
          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-3 gap-3 sm:grid-cols-6">
            {CATEGORY_ICONS.map(({ key, icon: Icon }) => (
              <Link
                key={key}
                href={`/search?category=${key}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm font-medium hover:border-primary hover:text-primary"
              >
                <Icon className="h-6 w-6" aria-hidden />
                {t(`categories.${key}`)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Promo banners */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <Link
            href="/trade-in"
            className="group relative flex min-h-[220px] flex-col justify-center overflow-hidden rounded-2xl bg-primary p-8 text-primary-foreground lg:col-span-2"
          >
            <div className="relative z-10 max-w-md">
              <p className="text-sm font-semibold uppercase tracking-wider opacity-80">SoukHub Trade-in</p>
              <h2 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{t('bannerDealsTitle')}</h2>
              <p className="mt-2 opacity-90">{t('bannerDealsText')}</p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-lg bg-background px-5 py-2.5 font-semibold text-primary">
                {t('bannerDealsCta')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </span>
            </div>
            {bannerImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bannerImage}
                alt=""
                aria-hidden
                className="absolute -end-6 top-1/2 hidden h-[130%] -translate-y-1/2 object-contain opacity-90 transition-transform group-hover:scale-105 sm:block"
              />
            )}
          </Link>
          <div className="grid gap-4">
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface-warm p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Banknote className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h3 className="font-bold">{t('bannerCodTitle')}</h3>
                <p className="text-sm text-muted-foreground">{t('bannerCodText')}</p>
              </div>
            </div>
            <Link href="/sell" className="flex items-center gap-4 rounded-2xl border border-border bg-surface-warm p-6 hover:border-primary">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Store className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h3 className="font-bold">{t('bannerSellTitle')}</h3>
                <p className="text-sm text-muted-foreground">{t('bannerSellText')}</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Deals under AED 500 */}
      {deals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-accent">{t('dealsTitle')}</h2>
            <Link href="/search?max=500" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              {t('dealsAll')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {deals.slice(0, 4).map((item) => (
              <CatalogCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Latest listings — real inventory above the fold */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t('latestListings')}</h2>
          <Link
            href="/search"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            {t('browseAll')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Link>
        </div>
        {listings.length === 0 ? (
          <p className="mt-6 rounded-xl border border-border bg-surface-warm p-10 text-center text-muted-foreground">
            {t('noListingsYet')}
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {listings.slice(0, 8).map((listing) => (
              <ProductCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* Market catalog filler (ADR 0016) */}
      {catalog.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold">{tcat('fromMarket')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{tcat('marketNote')}</p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {catalog.slice(0, 8).map((item) => (
              <CatalogCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Buyer trust */}
      <section className="border-y border-border bg-surface-warm">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">{t('trustTitle')}</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_ICONS.map(({ key, icon: Icon }) => (
              <div key={key} className="rounded-xl border border-border bg-card p-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">{t(`trust.${key}Title`)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(`trust.${key}Text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compact seller banner → /sell */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-card p-8 text-center sm:flex-row sm:text-start">
          <div>
            <h2 className="text-xl font-bold">{t('sellBannerTitle')}</h2>
            <p className="mt-1 text-muted-foreground">{t('sellBannerText')}</p>
          </div>
          <Link
            href="/sell"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            {t('sellBannerCta')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border p-6 text-center sm:flex-row sm:gap-8">
          <span className="inline-flex items-center gap-2 font-medium">
            <Banknote className="h-5 w-5 text-primary" aria-hidden />
            {t('codStrip')}
          </span>
          <span className="inline-flex items-center gap-2 font-medium">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
            {t('gradedStrip')}
          </span>
          <span className="inline-flex items-center gap-2 font-medium">
            <MessageCircle className="h-5 w-5 text-primary" aria-hidden />
            {t('languagesStrip')}
          </span>
        </div>
      </section>


    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Menu,
  X,
  Home,
  Search,
  Sparkles,
  Store,
  LogIn,
  Smartphone,
  Laptop,
  Tablet,
  Headphones,
  Watch,
  Gamepad2,
} from 'lucide-react';
import NextLink from 'next/link';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from './LocaleSwitcher';

/** Mobile back button — history back with a home fallback. */
export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === '/ar';
  if (isHome) return null;
  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push('/');
      }}
      aria-label="back"
      className="rounded-lg p-2 hover:bg-muted sm:hidden"
    >
      <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
    </button>
  );
}

const CATEGORIES = [
  { key: 'phones', icon: Smartphone },
  { key: 'laptops', icon: Laptop },
  { key: 'tablets', icon: Tablet },
  { key: 'audio', icon: Headphones },
  { key: 'wearables', icon: Watch },
  { key: 'gaming', icon: Gamepad2 },
] as const;

/** Hamburger menu with full site navigation (mobile). */
export function MobileMenu() {
  const t = useTranslations('nav');
  const th = useTranslations('home');
  const tc = useTranslations('common');
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigation (route change is an external event we sync to)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('menu')}
        className="rounded-lg p-2 hover:bg-muted lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-40 bg-foreground/25 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <nav
        aria-label={t('menu')}
        className={`fixed inset-y-0 start-0 z-50 flex w-[300px] max-w-[85vw] flex-col bg-background shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border bg-surface-warm px-4 py-3.5">
          <span className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-4 w-4" aria-hidden />
            </span>
            {tc('brand')}
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="close"
            className="rounded-lg p-2 hover:bg-muted"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium hover:bg-muted">
            <Home className="h-4.5 w-4.5 text-primary" aria-hidden />
            {t('home')}
          </Link>
          <Link href="/search" className="flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium hover:bg-muted">
            <Search className="h-4.5 w-4.5 text-primary" aria-hidden />
            {t('browse')}
          </Link>
          <Link href="/trade-in" className="flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium hover:bg-muted">
            <Sparkles className="h-4.5 w-4.5 text-primary" aria-hidden />
            {t('tradeIn')}
          </Link>
          <Link href="/sell" className="flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium hover:bg-muted">
            <Store className="h-4.5 w-4.5 text-primary" aria-hidden />
            {t('forSellers')}
          </Link>

          <p className="mt-4 px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('categories')}
          </p>
          {CATEGORIES.map(({ key, icon: Icon }) => (
            <Link
              key={key}
              href={`/search?category=${key}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
            >
              <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
              {th(`categories.${key}`)}
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border p-4">
          <NextLink
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            {tc('login')}
          </NextLink>
          <LocaleSwitcher />
        </div>
      </nav>
    </>
  );
}

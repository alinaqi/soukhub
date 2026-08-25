import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { Store, Search } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from './LocaleSwitcher';

/** Compact header for search / store / product pages. */
export function PublicHeader({ defaultQuery = '' }: { defaultQuery?: string }) {
  const t = useTranslations('common');

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-4 w-4" aria-hidden />
          </span>
          <span className="hidden text-xl font-bold tracking-tight sm:inline">
            {t('brand')}
          </span>
        </Link>

        <form action="/search" className="flex flex-1 items-center gap-2" role="search">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              name="q"
              defaultValue={defaultQuery}
              placeholder={t('searchPlaceholder')}
              className="w-full rounded-lg border border-border bg-card py-2 ps-9 pe-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="submit"
            className="hidden rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover sm:inline-flex"
          >
            {t('search')}
          </button>
        </form>

        <Suspense>
          <LocaleSwitcher />
        </Suspense>
      </div>
    </header>
  );
}

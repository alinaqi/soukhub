import { useTranslations } from 'next-intl';
import { Store } from 'lucide-react';
import NextLink from 'next/link';
import { Link } from '@/i18n/navigation';

/** Global footer for every public page. */
export function SiteFooter() {
  const t = useTranslations('home');
  const tn = useTranslations('nav');
  const tc = useTranslations('common');

  return (
    <footer className="mt-16 border-t border-border bg-surface-warm">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Store className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-xl font-bold">{tc('brand')}</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t('footerTagline')}</p>
          </div>
          <div>
            <h4 className="font-semibold">{t('footer.buy')}</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/search?category=phones" className="hover:text-primary">
                  {t('categories.phones')}
                </Link>
              </li>
              <li>
                <Link href="/search?category=laptops" className="hover:text-primary">
                  {t('categories.laptops')}
                </Link>
              </li>
              <li>
                <Link href="/search?category=audio" className="hover:text-primary">
                  {t('categories.audio')}
                </Link>
              </li>
              <li>
                <Link href="/trade-in" className="hover:text-primary">
                  {tn('tradeIn')}
                </Link>
              </li>
              <li>
                <Link href="/providers" className="hover:text-primary">
                  {tn('shops')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">{t('footer.sell')}</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/sell" className="hover:text-primary">
                  {tn('forSellers')}
                </Link>
              </li>
              <li>
                <NextLink href="/login" className="hover:text-primary">
                  {t('footer.sellerConsole')}
                </NextLink>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">{t('footer.company')}</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <NextLink href="/privacy" className="hover:text-primary">
                  {t('footer.privacy')}
                </NextLink>
              </li>
              <li>
                <NextLink href="/terms" className="hover:text-primary">
                  {t('footer.terms')}
                </NextLink>
              </li>
              <li>
                <a
                  href="https://github.com/alinaqi/soukhub"
                  className="hover:text-primary"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {t('footer.openSource')}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-sm text-muted-foreground">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}

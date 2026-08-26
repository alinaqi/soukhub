import { useTranslations, useLocale } from 'next-intl';
import { Flame } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { formatAED, productPath } from '@/lib/marketplace/format';
import type { SellerDeal } from '@/lib/marketplace/deals-service';

/** Home promotion for seller-run deals: deal price, struck list price,
 * seller name — links straight to the product page. */
export function SellerDealsStrip({ deals }: { deals: SellerDeal[] }) {
  const t = useTranslations('home');
  const locale = useLocale();
  if (deals.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <Flame className="h-6 w-6 text-accent" aria-hidden />
        {t('sellerDealsTitle')}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('sellerDealsText')}</p>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {deals.slice(0, 4).map((deal) => {
          const p = deal.product;
          const name = locale === 'ar' && p.title_ar ? p.title_ar : p.name;
          const image = Array.isArray(p.images) ? p.images[0] : null;
          return (
            <Link
              key={deal.id}
              href={productPath(p.slug ?? '', p.short_id)}
              className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary hover:shadow-sm"
            >
              <span className="relative block aspect-square bg-muted">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-full items-center justify-center text-muted-foreground">
                    <Flame className="h-8 w-8" aria-hidden />
                  </span>
                )}
                <span className="absolute start-2 top-2 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-white">
                  {t('dealChip')}
                </span>
              </span>
              <span className="block p-3">
                <span className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
                  {name}
                </span>
                <span className="mt-1.5 flex flex-wrap items-baseline gap-1.5">
                  <span className="font-bold text-accent">{formatAED(deal.deal_price, locale)}</span>
                  {p.base_price != null && p.base_price > deal.deal_price && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatAED(p.base_price, locale)}
                    </span>
                  )}
                </span>
                {deal.store_name && (
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {deal.store_name}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

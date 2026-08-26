import { useLocale, useTranslations } from 'next-intl';
import { ImageOff, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { formatAED } from '@/lib/marketplace/format';
import type { PublicCatalogItem } from '@/lib/marketplace/queries';

/**
 * Reference-catalog card (ADR 0016): clearly badged with its source and
 * linking out — never dressed up as a SoukHub listing.
 */
export function CatalogCard({ item }: { item: PublicCatalogItem }) {
  const locale = useLocale();
  const t = useTranslations('catalog');
  const title = locale === 'ar' && item.title_ar ? item.title_ar : item.title;
  const image = Array.isArray(item.images) ? (item.images[0] as string | undefined) : undefined;
  const sourceName = t(`sources.${item.source}`);

  return (
    <Link
      href={`/m/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-dashed border-border bg-card transition-colors hover:border-primary"
    >
      <div className="relative aspect-square bg-muted">
        {image ? (
          // Remote marketplace CDNs — rendered unoptimized on purpose
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain p-2"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8" aria-hidden />
          </span>
        )}
        <span className="absolute start-2 top-2 rounded-full bg-foreground/80 px-2 py-0.5 text-xs font-medium text-background">
          {sourceName}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium group-hover:text-primary">{title}</h3>
        {item.price != null && (
          <p className="text-base font-bold">{formatAED(Number(item.price), locale)}</p>
        )}
        <p className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-primary">
          {t('requestTitle')}
          <ArrowRight className="h-3 w-3 rtl:rotate-180" aria-hidden />
        </p>
      </div>
    </Link>
  );
}

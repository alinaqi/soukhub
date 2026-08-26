import { getTranslations } from 'next-intl/server';
import { ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { breadcrumbJsonLd, safeJsonLd } from '@/lib/marketplace/jsonld';

const KNOWN_CATEGORIES = ['phones', 'laptops', 'tablets', 'audio', 'wearables', 'gaming'];

/**
 * Visible breadcrumb trail (Home → Category → Item) with optional
 * BreadcrumbList JSON-LD for pages that don't already emit one.
 */
export async function Breadcrumbs({
  locale,
  category,
  title,
  currentPath,
  includeJsonLd = true,
}: {
  locale: string;
  category: string | null;
  title: string;
  currentPath: string;
  includeJsonLd?: boolean;
}) {
  const tn = await getTranslations({ locale, namespace: 'nav' });
  const th = await getTranslations({ locale, namespace: 'home' });
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://soukhub.vercel.app';
  const prefix = locale === 'ar' ? '/ar' : '';

  const knownCategory = category && KNOWN_CATEGORIES.includes(category) ? category : null;
  const categoryLabel = knownCategory ? th(`categories.${knownCategory}`) : null;
  const shortTitle = title.length > 48 ? `${title.slice(0, 48).trimEnd()}…` : title;

  const jsonLd = breadcrumbJsonLd([
    { name: tn('home'), url: `${base}${prefix}/` },
    ...(knownCategory && categoryLabel
      ? [{ name: categoryLabel, url: `${base}${prefix}/search?category=${knownCategory}` }]
      : []),
    { name: title, url: `${base}${prefix}${currentPath}` },
  ]);

  return (
    <>
      {includeJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      )}
      <nav aria-label="breadcrumb" className="min-w-0">
        <ol className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          <li className="shrink-0">
            <Link href="/" className="hover:text-primary">
              {tn('home')}
            </Link>
          </li>
          {knownCategory && categoryLabel && (
            <>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 rtl:rotate-180" aria-hidden />
              <li className="shrink-0">
                <Link href={`/search?category=${knownCategory}`} className="hover:text-primary">
                  {categoryLabel}
                </Link>
              </li>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 shrink-0 rtl:rotate-180" aria-hidden />
          <li aria-current="page" className="truncate font-medium text-foreground">
            {shortTitle}
          </li>
        </ol>
      </nav>
    </>
  );
}

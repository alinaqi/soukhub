import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

const CATEGORIES = ['phones', 'laptops', 'tablets', 'audio', 'wearables', 'gaming'] as const;

/** Slim category quick-nav for product/catalog pages. */
export async function CategoryChips({
  locale,
  active,
}: {
  locale: string;
  active?: string | null;
}) {
  const th = await getTranslations({ locale, namespace: 'home' });
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {CATEGORIES.map((key) => (
        <Link
          key={key}
          href={`/search?category=${key}`}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
            active === key
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border hover:border-primary hover:text-primary'
          }`}
        >
          {th(`categories.${key}`)}
        </Link>
      ))}
    </div>
  );
}

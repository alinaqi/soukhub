'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';

/** EN ⇄ AR toggle that preserves the current path and query. */
export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const other = locale === 'ar' ? 'en' : 'ar';

  const switchLocale = () => {
    const query = searchParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { locale: other });
  };

  return (
    <button
      type="button"
      onClick={switchLocale}
      className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
      aria-label={other === 'ar' ? 'التبديل إلى العربية' : 'Switch to English'}
    >
      {other === 'ar' ? 'العربية' : 'English'}
    </button>
  );
}

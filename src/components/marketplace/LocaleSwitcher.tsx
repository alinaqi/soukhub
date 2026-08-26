'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, Globe } from 'lucide-react';
import type { Locale } from '@/i18n/routing';

/** Major UAE languages, shown as endonyms. */
const LANGUAGES: Array<{ code: Locale; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ur', label: 'اردو' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'tl', label: 'Filipino' },
];

/** Language menu that preserves the current path and query. */
export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  const switchLocale = (code: Locale) => {
    setOpen(false);
    const query = searchParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { locale: code });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
      >
        <Globe className="h-4 w-4" aria-hidden />
        {current.label}
        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open && (
        <ul className="absolute end-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg">
          {LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                onClick={() => switchLocale(lang.code)}
                className={`block w-full px-3 py-2 text-start text-sm hover:bg-muted ${
                  lang.code === locale ? 'font-semibold text-primary' : ''
                }`}
              >
                {lang.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

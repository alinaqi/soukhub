import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ar', 'hi', 'ur', 'ml', 'tl'],
  defaultLocale: 'en',
  // Default locale unprefixed (/search), Arabic prefixed (/ar/search)
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];

export function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

/** Text direction for a locale — Arabic and Urdu are RTL. */
export function getDir(locale: string): 'ltr' | 'rtl' {
  return locale === 'ar' || locale === 'ur' ? 'rtl' : 'ltr';
}

/** Locale-prefixed path: default locale unprefixed, others prefixed. */
export function localePath(locale: string, path: string): string {
  return locale === routing.defaultLocale ? path : `/${locale}${path}`;
}

/** hreflang languages map for a path across all supported locales. */
export function localeAlternates(path: string, base = ''): Record<string, string> {
  return Object.fromEntries(
    routing.locales.map((l) => [l, `${base}${localePath(l, path)}`])
  );
}

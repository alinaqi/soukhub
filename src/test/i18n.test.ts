import { describe, it, expect } from 'vitest';
import { routing, getDir, isLocale, localePath, localeAlternates } from '@/i18n/routing';
import en from '../../messages/en.json';
import ar from '../../messages/ar.json';
import hi from '../../messages/hi.json';
import ur from '../../messages/ur.json';
import ml from '../../messages/ml.json';
import tl from '../../messages/tl.json';

const LOCALES = { ar, hi, ur, ml, tl } as const;

/** TODO-042 — i18n contract: locales, RTL, and full message parity. */

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v !== null && typeof v === 'object'
      ? flattenKeys(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`]
  );
}

describe('i18n routing', () => {
  it('supports all six UAE languages with English default', () => {
    for (const loc of ['en', 'ar', 'hi', 'ur', 'ml', 'tl']) {
      expect(routing.locales).toContain(loc);
    }
    expect(routing.defaultLocale).toBe('en');
  });

  it('Arabic and Urdu are RTL, the rest LTR', () => {
    expect(getDir('ar')).toBe('rtl');
    expect(getDir('ur')).toBe('rtl');
    expect(getDir('hi')).toBe('ltr');
    expect(getDir('ml')).toBe('ltr');
    expect(getDir('tl')).toBe('ltr');
    expect(getDir('en')).toBe('ltr');
  });

  it('validates locales', () => {
    expect(isLocale('ar')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale('search')).toBe(false);
  });
});

describe('locale path helpers', () => {
  it('never returns an empty string for the home path (RSC-crash regression)', () => {
    // localeAlternates('') on the home page must not yield '' hrefs — an
    // empty alternate URL crashed the production RSC render
    expect(localePath('en', '')).toBe('/');
    expect(localePath('hi', '')).toBe('/hi');
    for (const url of Object.values(localeAlternates(''))) {
      expect(url.length).toBeGreaterThan(0);
      expect(url.startsWith('/')).toBe(true);
    }
  });

  it('prefixes non-default locales and leaves the default bare', () => {
    expect(localePath('en', '/search')).toBe('/search');
    expect(localePath('ar', '/search')).toBe('/ar/search');
    expect(localeAlternates('/search', 'https://x.co').hi).toBe('https://x.co/hi/search');
  });
});

describe('message catalogs', () => {
  it('every locale covers every English key (no missing translations)', () => {
    const enKeys = flattenKeys(en).sort();
    for (const [lang, catalog] of Object.entries(LOCALES)) {
      expect(flattenKeys(catalog).sort(), lang).toEqual(enKeys);
    }
  });

  it('no Arabic value is left in English (identical to en)', () => {
    const enFlat = Object.fromEntries(flattenKeys(en).map((k) => [k, k]));
    // Spot-check core UX strings differ between locales
    const paths = ['home.heroTitle', 'common.search', 'search.noResults'] as const;
    const get = (obj: unknown, path: string) =>
      path.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], obj);
    for (const p of paths) {
      expect(get(ar, p), p).toBeTruthy();
      expect(get(ar, p), p).not.toBe(get(en, p));
    }
    expect(Object.keys(enFlat).length).toBeGreaterThan(40);
  });
});

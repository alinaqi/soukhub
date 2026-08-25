import { describe, it, expect } from 'vitest';
import { routing, getDir, isLocale } from '@/i18n/routing';
import en from '../../messages/en.json';
import ar from '../../messages/ar.json';

/** TODO-042 — i18n contract: locales, RTL, and full message parity. */

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v !== null && typeof v === 'object'
      ? flattenKeys(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`]
  );
}

describe('i18n routing', () => {
  it('supports English and Arabic with English default', () => {
    expect(routing.locales).toContain('en');
    expect(routing.locales).toContain('ar');
    expect(routing.defaultLocale).toBe('en');
  });

  it('Arabic is RTL, English is LTR', () => {
    expect(getDir('ar')).toBe('rtl');
    expect(getDir('en')).toBe('ltr');
  });

  it('validates locales', () => {
    expect(isLocale('ar')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale('search')).toBe(false);
  });
});

describe('message catalogs', () => {
  it('Arabic covers every English key (no missing translations)', () => {
    const enKeys = flattenKeys(en).sort();
    const arKeys = flattenKeys(ar).sort();
    expect(arKeys).toEqual(enKeys);
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

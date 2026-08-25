import { describe, it, expect } from 'vitest';
import { validateStoreSlug, suggestStoreSlug, RESERVED_SLUGS } from '@/lib/marketplace/store-slug';

/** TODO-045 — store slug rules: url-safe, unique-ready, reserved words blocked. */

describe('validateStoreSlug', () => {
  it('accepts clean slugs', () => {
    expect(validateStoreSlug('ali-phones')).toEqual({ ok: true });
    expect(validateStoreSlug('tech4u')).toEqual({ ok: true });
  });

  it('rejects reserved routes', () => {
    for (const slug of ['api', 'admin', 'login', 'signup', 'search', 'p', 's', 'ar', 'en', 'dashboard', 'settings', 'privacy', 'terms', 'onboarding']) {
      expect(validateStoreSlug(slug), slug).toMatchObject({ ok: false, error: 'reserved' });
    }
  });

  it('rejects invalid characters and shapes', () => {
    expect(validateStoreSlug('Ali Phones')).toMatchObject({ ok: false, error: 'invalid' });
    expect(validateStoreSlug('ali_phones')).toMatchObject({ ok: false, error: 'invalid' });
    expect(validateStoreSlug('-ali')).toMatchObject({ ok: false, error: 'invalid' });
    expect(validateStoreSlug('ali-')).toMatchObject({ ok: false, error: 'invalid' });
    expect(validateStoreSlug('علي')).toMatchObject({ ok: false, error: 'invalid' });
  });

  it('rejects too short / too long', () => {
    expect(validateStoreSlug('ab')).toMatchObject({ ok: false, error: 'too_short' });
    expect(validateStoreSlug('a'.repeat(41))).toMatchObject({ ok: false, error: 'too_long' });
  });
});

describe('suggestStoreSlug', () => {
  it('slugifies a store name', () => {
    expect(suggestStoreSlug('Ali Phones & More')).toBe('ali-phones-more');
  });

  it('never suggests a reserved slug', () => {
    const s = suggestStoreSlug('Search');
    expect(RESERVED_SLUGS.has(s)).toBe(false);
    expect(validateStoreSlug(s)).toEqual({ ok: true });
  });

  it('falls back for non-latin names', () => {
    const s = suggestStoreSlug('هواتف علي');
    expect(validateStoreSlug(s)).toEqual({ ok: true });
  });

  it('pads too-short results', () => {
    const s = suggestStoreSlug('A');
    expect(validateStoreSlug(s)).toEqual({ ok: true });
  });
});

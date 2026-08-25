/**
 * Store slug rules (TODO-045). Slugs become public URLs (/s/{slug}) and must
 * never shadow app routes.
 */

export const RESERVED_SLUGS = new Set([
  'api', 'admin', 'app', 'login', 'signup', 'logout', 'callback', 'auth',
  'dashboard', 'onboarding', 'settings', 'search', 'p', 's', 'c', 'b',
  'ar', 'en', 'privacy', 'terms', 'legal', 'about', 'help', 'support',
  'blog', 'docs', 'store', 'stores', 'shop', 'seller', 'sellers',
  'orders', 'products', 'inventory', 'analytics', 'suppliers', 'customers',
  'communications', 'operations', 'packing', 'shipping', 'import', 'track',
  'cart', 'checkout', 'soukhub', 'www', 'mail', 'static', 'assets',
]);

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const MIN_LEN = 3;
const MAX_LEN = 40;

export type SlugValidation =
  | { ok: true }
  | { ok: false; error: 'invalid' | 'reserved' | 'too_short' | 'too_long' };

export function validateStoreSlug(slug: string): SlugValidation {
  if (!SLUG_RE.test(slug)) return { ok: false, error: 'invalid' };
  if (RESERVED_SLUGS.has(slug)) return { ok: false, error: 'reserved' };
  if (slug.length < MIN_LEN) return { ok: false, error: 'too_short' };
  if (slug.length > MAX_LEN) return { ok: false, error: 'too_long' };
  return { ok: true };
}

/** Best-effort slug from a store name; always returns something valid. */
export function suggestStoreSlug(name: string): string {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_LEN)
    .replace(/-+$/g, '');

  if (slug.length < MIN_LEN) {
    slug = slug ? `${slug}-store` : 'my-store';
  }
  if (RESERVED_SLUGS.has(slug)) {
    slug = `${slug}-store`.slice(0, MAX_LEN);
  }
  return slug;
}

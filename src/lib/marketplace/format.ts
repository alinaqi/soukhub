/** Price/URL formatting helpers for the buyer surface (ADR 0011). */

/** AED price, Western Arabic numerals in both locales (UAE convention). */
export function formatAED(value: number, locale: string): string {
  const amount = new Intl.NumberFormat('en-AE', {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(value);
  return locale === 'ar' ? `${amount} د.إ` : `AED ${amount}`;
}

/** Canonical product path: /p/{slug}-{shortId} (locale prefix added by Link). */
export function productPath(slug: string, shortId: string): string {
  return `/p/${slug}-${shortId}`;
}

/** Parse "{slug}-{shortId}" — shortId is the last 8-hex segment. */
export function parseSlugId(slugId: string): { slug: string; shortId: string } | null {
  const m = /^(.*)-([a-f0-9]{8})$/.exec(slugId);
  if (!m) return null;
  return { slug: m[1], shortId: m[2] };
}

/** Canonical catalog path: /m/{slug}-{shortId}, uuid fallback for legacy rows. */
export function catalogPath(item: { id: string; slug?: string | null; short_id?: string | null }): string {
  return item.slug && item.short_id ? `/m/${item.slug}-${item.short_id}` : `/m/${item.id}`;
}

/** wa.me deep link with a prefilled order message. */
export function whatsAppOrderLink(phone: string, message: string): string {
  let cleaned = phone.replace(/[\s\-()+]/g, '');
  if (cleaned.startsWith('05')) cleaned = '971' + cleaned.slice(1);
  else if (cleaned.length === 9 && !cleaned.startsWith('971')) cleaned = '971' + cleaned;
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

/** Allowlisted internal route prefixes the assistant may link to. */
const INTERNAL_LINK_PREFIXES = ['/p/', '/m/', '/s/', '/search', '/trade-in', '/sell', '/checkout/'];

/**
 * Accept only same-origin internal paths (rejects protocol-relative "//evil"
 * and anything off the route allowlist) — LLM output is untrusted.
 */
export function safeInternalPath(href: string): string | null {
  if (!href.startsWith('/') || href.startsWith('//')) return null;
  const path = href.split(/[?#]/)[0];
  const normalized = path.startsWith('/ar/') ? path.slice(3) : path;
  return INTERNAL_LINK_PREFIXES.some((p) => normalized === p.replace(/\/$/, '') || normalized.startsWith(p))
    ? href
    : null;
}

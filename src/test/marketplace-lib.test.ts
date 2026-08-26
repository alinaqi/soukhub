import { describe, it, expect } from 'vitest';
import { formatAED, parseSlugId, productPath, whatsAppOrderLink } from '@/lib/marketplace/format';
import { productJsonLd, breadcrumbJsonLd, websiteJsonLd } from '@/lib/marketplace/jsonld';

/** TODO-043/044 — pure helpers behind the buyer surface. */

describe('formatAED', () => {
  it('formats English prices', () => {
    expect(formatAED(1299, 'en')).toBe('AED 1,299');
  });
  it('formats Arabic prices with the dirham sign after', () => {
    expect(formatAED(1299, 'ar')).toBe('1,299 د.إ');
  });
  it('keeps fils only when present', () => {
    expect(formatAED(99.5, 'en')).toBe('AED 99.5');
    expect(formatAED(100, 'ar')).toBe('100 د.إ');
  });
});

describe('product URLs', () => {
  it('builds /p/{slug}-{shortId}', () => {
    expect(productPath('iphone-15-pro', 'a1b2c3d4')).toBe('/p/iphone-15-pro-a1b2c3d4');
  });
  it('parses slug + shortId back out (slug may contain dashes)', () => {
    expect(parseSlugId('iphone-15-pro-a1b2c3d4')).toEqual({
      slug: 'iphone-15-pro',
      shortId: 'a1b2c3d4',
    });
  });
  it('rejects malformed ids', () => {
    expect(parseSlugId('not-a-valid-id')).toBeNull();
    expect(parseSlugId('nodash')).toBeNull();
  });
});

describe('whatsAppOrderLink', () => {
  it('normalizes UAE local numbers and encodes the message', () => {
    const link = whatsAppOrderLink('050 123 4567', 'Order: iPhone 15');
    expect(link).toBe('https://wa.me/971501234567?text=Order%3A%20iPhone%2015');
  });
  it('keeps international numbers', () => {
    expect(whatsAppOrderLink('+971 55 111 2222', 'hi')).toContain('wa.me/971551112222');
  });
});

describe('JSON-LD builders (ADR 0013)', () => {
  it('produces a valid Product + Offer', () => {
    const ld = productJsonLd({
      name: 'iPhone 15 Pro 256GB',
      images: ['https://img.example/1.jpg'],
      price: 3499,
      condition: 'excellent',
      storeName: 'Ali Phones',
      url: 'https://soukhub.vercel.app/p/iphone-15-pro-a1b2c3d4',
    });
    expect(ld['@type']).toBe('Product');
    expect(ld.offers.priceCurrency).toBe('AED');
    expect(ld.offers.price).toBe(3499);
    expect(ld.offers.itemCondition).toBe('https://schema.org/UsedCondition');
    expect(ld.offers.availability).toBe('https://schema.org/InStock');
    expect(ld.offers.seller.name).toBe('Ali Phones');
  });

  it('maps new/renewed conditions to schema.org terms', () => {
    const base = { name: 'x', images: [], price: 1, storeName: 's', url: 'u' };
    expect(productJsonLd({ ...base, condition: 'new' }).offers.itemCondition).toBe(
      'https://schema.org/NewCondition'
    );
    expect(productJsonLd({ ...base, condition: 'renewed' }).offers.itemCondition).toBe(
      'https://schema.org/RefurbishedCondition'
    );
  });

  it('omits itemCondition when the condition is unknown (never fabricates)', () => {
    const base = { name: 'x', images: [], price: 1, storeName: 's', url: 'u' };
    expect(productJsonLd(base).offers).not.toHaveProperty('itemCondition');
  });

  it('builds breadcrumbs with positions', () => {
    const ld = breadcrumbJsonLd([
      { name: 'Home', url: 'https://x/' },
      { name: 'Phones', url: 'https://x/search?category=phones' },
    ]);
    expect(ld.itemListElement).toHaveLength(2);
    expect(ld.itemListElement[1].position).toBe(2);
  });

  it('declares the site search box', () => {
    const ld = websiteJsonLd('https://soukhub.vercel.app');
    expect(ld.potentialAction.target.urlTemplate).toContain('{search_term_string}');
  });
});

describe('safeJsonLd', () => {
  it('escapes </script> breakouts from seller-generated text', async () => {
    const { safeJsonLd } = await import('@/lib/marketplace/jsonld');
    const out = safeJsonLd({ description: 'evil</script><script>alert(1)</script>' });
    expect(out).not.toContain('</script>');
    expect(out).toContain('\\u003c/script');
    expect(JSON.parse(out).description).toContain('</script>');
  });
});

describe('safeInternalPath (assistant link guard)', () => {
  it('allows allowlisted internal routes', async () => {
    const { safeInternalPath } = await import('@/lib/marketplace/format');
    expect(safeInternalPath('/p/iphone-15-abc12345')).toBeTruthy();
    expect(safeInternalPath('/m/666d1c9f-4b3e-4073-9d27-b4f8eaa0fc31')).toBeTruthy();
    expect(safeInternalPath('/trade-in')).toBeTruthy();
    expect(safeInternalPath('/ar/search?q=iphone')).toBeTruthy();
  });
  it('rejects protocol-relative, external, and off-allowlist paths', async () => {
    const { safeInternalPath } = await import('@/lib/marketplace/format');
    expect(safeInternalPath('//evil.com/p/x')).toBeNull();
    expect(safeInternalPath('https://evil.com')).toBeNull();
    expect(safeInternalPath('/api/admin/ingest')).toBeNull();
    expect(safeInternalPath('/dashboard')).toBeNull();
  });
});

/** Structured data builders for SEO/GEO (ADR 0013). */

/**
 * Serialize JSON-LD for a <script> tag. Escapes `<` so seller-generated
 * text (e.g. a description containing "</script>") cannot break out.
 */
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

export interface ProductJsonLdInput {
  name: string;
  description?: string | null;
  images: string[];
  price: number;
  condition?: string | null;
  storeName: string;
  url: string;
  inStock?: boolean;
}

const CONDITION_MAP: Record<string, string> = {
  new: 'https://schema.org/NewCondition',
  renewed: 'https://schema.org/RefurbishedCondition',
  excellent: 'https://schema.org/UsedCondition',
  very_good: 'https://schema.org/UsedCondition',
  good: 'https://schema.org/UsedCondition',
  fair: 'https://schema.org/UsedCondition',
};

export function productJsonLd(p: ProductJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    ...(p.description ? { description: p.description } : {}),
    ...(p.images.length ? { image: p.images } : {}),
    offers: {
      '@type': 'Offer',
      url: p.url,
      priceCurrency: 'AED',
      price: p.price,
      availability: p.inStock === false
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      itemCondition: CONDITION_MAP[p.condition ?? 'new'] ?? 'https://schema.org/UsedCondition',
      seller: { '@type': 'Organization', name: p.storeName },
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function websiteJsonLd(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SoukHub',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${baseUrl}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

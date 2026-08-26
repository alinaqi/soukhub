/**
 * Map raw scraper output (Apify actors) onto catalog rows (ADR 0016).
 * Defensive by design: scraped shapes drift, so every field degrades
 * gracefully and obviously-broken items are dropped.
 */

export interface CatalogItem {
  source: 'amazon' | 'cartlow' | 'revibe';
  source_id: string;
  url: string;
  title: string;
  brand: string | null;
  model: string | null;
  category: string | null;
  condition: string | null;
  price: number | null;
  currency: string;
  images: string[];
  attributes: Record<string, unknown>;
}

const KNOWN_BRANDS = [
  'Apple', 'Samsung', 'Google', 'Xiaomi', 'OnePlus', 'Huawei', 'Honor',
  'Oppo', 'Vivo', 'Realme', 'Nothing', 'Sony', 'Nokia', 'Motorola',
  'Lenovo', 'Dell', 'HP', 'Asus', 'Acer', 'Microsoft', 'JBL', 'Bose',
  'Anker', 'Garmin', 'Fitbit', 'Dyson', 'Nintendo',
];

export function inferBrand(title: string): string | null {
  const lower = title.toLowerCase();
  if (/\biphone|ipad|macbook|airpods|apple watch|imac\b/.test(lower)) return 'Apple';
  if (/\bgalaxy\b/.test(lower)) return 'Samsung';
  if (/\bpixel\b/.test(lower)) return 'Google';
  if (/\bplaystation|\bps5\b|\bps4\b/.test(lower)) return 'Sony';
  if (/\bxbox\b/.test(lower)) return 'Microsoft';
  for (const brand of KNOWN_BRANDS) {
    if (lower.includes(brand.toLowerCase())) return brand;
  }
  return null;
}

export function inferCategory(title: string): string | null {
  const t = title.toLowerCase();
  if (/\b(iphone|pixel|phone|smartphone|redmi|oneplus \d)\b/.test(t) || /galaxy ?[sazm]\d|galaxy (note|fold|flip)/.test(t)) return 'phones';
  if (/\b(macbook|laptop|notebook|thinkpad|ideapad|vivobook|zenbook|chromebook)\b/.test(t)) return 'laptops';
  if (/\b(ipad|tablet|tab s|tab a)\b/.test(t)) return 'tablets';
  if (/\b(airpods|headphone|earbud|earphone|speaker|soundbar|buds)\b/.test(t)) return 'audio';
  if (/\b(watch|band|fitbit|garmin)\b/.test(t)) return 'wearables';
  if (/\b(playstation|xbox|nintendo|ps5|ps4|console|controller)\b/.test(t)) return 'gaming';
  return null;
}

export function inferCondition(text: string | null | undefined): string | null {
  if (!text) return null;
  const t = text.toLowerCase();
  if (/renewed|refurb/.test(t)) return 'renewed';
  if (/excellent/.test(t)) return 'excellent';
  if (/very good/.test(t)) return 'very_good';
  if (/\bgood\b/.test(t)) return 'good';
  if (/\bfair\b|acceptable/.test(t)) return 'fair';
  if (/\bnew\b/.test(t)) return 'new';
  return null;
}

function parsePrice(value: unknown): number | null {
  if (typeof value === 'number' && isFinite(value) && value > 0) return value;
  if (typeof value === 'string') {
    const n = Number(value.replace(/[^0-9.]/g, ''));
    if (isFinite(n) && n > 0) return n;
  }
  return null;
}

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

type Raw = Record<string, unknown>;

/** junglee/amazon-crawler item shape (amazon.ae). */
export function mapAmazonItem(raw: Raw): CatalogItem | null {
  const title = asString(raw.title);
  const asin = asString(raw.asin);
  const url = asString(raw.url) ?? (asin ? `https://www.amazon.ae/dp/${asin}` : null);
  if (!title || !asin || !url) return null;
  const priceObj = raw.price as Raw | undefined;
  const price = parsePrice(priceObj?.value ?? raw.price);
  const image = asString(raw.thumbnailImage) ?? asString(raw.imageUrl) ?? asString(raw.image);
  return {
    source: 'amazon',
    source_id: asin,
    url,
    title,
    brand: asString(raw.brand) ?? inferBrand(title),
    model: null,
    category: inferCategory(title),
    condition: inferCondition(title) ?? 'new',
    price,
    currency: asString(priceObj?.currency as unknown) ?? 'AED',
    images: image ? [image] : [],
    attributes: { stars: raw.stars ?? null, reviewsCount: raw.reviewsCount ?? null },
  };
}

/** Generic shape produced by our cheerio-scraper page functions. */
function mapGenericItem(source: 'cartlow' | 'revibe') {
  return (raw: Raw): CatalogItem | null => {
    const title = asString(raw.title);
    const url = asString(raw.url);
    if (!title || !url) return null;
    const sourceId = asString(raw.sourceId) ?? url.replace(/^https?:\/\//, '').slice(0, 200);
    const price = parsePrice(raw.price);
    const image = asString(raw.image);
    return {
      source,
      source_id: sourceId,
      url,
      title,
      brand: asString(raw.brand) ?? inferBrand(title),
      model: null,
      category: asString(raw.category) ?? inferCategory(title),
      condition: inferCondition(asString(raw.condition) ?? title) ?? 'renewed',
      price,
      currency: 'AED',
      images: image ? [image] : [],
      attributes: {},
    };
  };
}

export const mapCartlowItem = mapGenericItem('cartlow');
export const mapRevibeItem = mapGenericItem('revibe');

export const MAPPERS: Record<CatalogItem['source'], (raw: Raw) => CatalogItem | null> = {
  amazon: mapAmazonItem,
  cartlow: mapCartlowItem,
  revibe: mapRevibeItem,
};

export function mapItems(source: CatalogItem['source'], rawItems: Raw[]): CatalogItem[] {
  const seen = new Set<string>();
  const out: CatalogItem[] = [];
  for (const raw of rawItems) {
    const item = MAPPERS[source](raw);
    if (!item || seen.has(item.source_id)) continue;
    seen.add(item.source_id);
    out.push(item);
  }
  return out;
}

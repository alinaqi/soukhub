import type { CatalogItem } from './mappers';

/**
 * Per-source Apify run configurations (ADR 0016).
 * Amazon uses the maintained junglee/amazon-crawler actor; Cartlow and
 * Revibe use apify/cheerio-scraper with tunable selectors (their markup
 * changes — adjust pageFunction selectors here, nothing else moves).
 */

export interface SourceConfig {
  source: CatalogItem['source'];
  actorId: string;
  input: Record<string, unknown>;
}

const CHEERIO_ACTOR = 'apify/cheerio-scraper';

function cartlowPageFunction(): string {
  // Cartlow search pages (apify/web-scraper, jQuery injected). Cards use
  // .lst_card with /uae/en/product-detail/{slug}/{id} links; the title lives
  // in the product image's alt; card text carries "Condition: X" and prices.
  return `async function pageFunction(context) {
  const $ = context.jQuery;
  await new Promise(r => setTimeout(r, 6000)); // client-side rendering
  const items = [];
  $('a[href*="/product-detail/"]').each((_, el) => {
    const a = $(el);
    const card = a.closest('.lst_card').length ? a.closest('.lst_card') : a;
    const img = card.find('img').first();
    const text = card.text().replace(/\\s+/g, ' ').trim();
    const title = (img.attr('alt') || '').trim() || (text.split('Condition:')[0] || '').replace(/Trusted Seller/i, '').trim();
    const conditionMatch = /Condition:\\s*([A-Za-z ]+?)(?=\\d|ê|AED|$)/.exec(text);
    const priceMatch = /([0-9][0-9,]*\\.?[0-9]*)/.exec(text.split('Condition:')[1] || text);
    const href = a.attr('href');
    if (!title || !href) return;
    items.push({
      title,
      url: new URL(href, context.request.loadedUrl).href,
      price: priceMatch ? priceMatch[1] : '',
      image: img.attr('src') || img.attr('data-src') || null,
      condition: conditionMatch ? conditionMatch[1].trim() : null,
    });
  });
  return items;
}`;
}

function cheerioPageFunction(): string {
  // Runs inside Apify; extracts a generic product-card shape.
  return `async function pageFunction(context) {
  const { $, request } = context;
  const items = [];
  $('a[href*="/product"], a[href*="/p/"], .product-card a, .product-item a').each((_, el) => {
    const a = $(el);
    const card = a.closest('.product-card, .product-item, li, article, div');
    const title = (card.find('h2, h3, .title, .product-title, .name').first().text() || a.attr('title') || '').trim();
    const priceText = (card.find('.price, [class*="price"]').first().text() || '').trim();
    const image = card.find('img').first().attr('src') || card.find('img').first().attr('data-src') || null;
    const href = a.attr('href');
    if (!title || !href) return;
    items.push({
      title,
      url: new URL(href, request.loadedUrl).href,
      price: priceText,
      image,
      condition: (card.find('[class*="condition"], .badge').first().text() || '').trim() || null,
    });
  });
  return items;
}`;
}

export const SOURCES: Record<CatalogItem['source'], SourceConfig> = {
  amazon: {
    source: 'amazon',
    actorId: 'junglee/amazon-crawler',
    input: {
      categoryOrProductUrls: [
        { url: 'https://www.amazon.ae/s?k=smartphone' },
        { url: 'https://www.amazon.ae/s?k=iphone' },
        { url: 'https://www.amazon.ae/s?k=samsung+galaxy' },
      ],
      maxItemsPerStartUrl: 25,
      proxyCountry: 'AE',
      scrapeProductDetails: false,
      useCaptchaSolver: false,
    },
  },
  cartlow: {
    source: 'cartlow',
    // Cartlow sits behind a JS challenge — needs a real browser (web-scraper)
    actorId: 'apify/web-scraper',
    input: {
      startUrls: [
        { url: 'https://cartlow.com/uae/en/search?query=iphone' },
        { url: 'https://cartlow.com/uae/en/search?query=samsung+galaxy' },
        { url: 'https://cartlow.com/uae/en/search?query=smartphone' },
      ],
      pageFunction: cartlowPageFunction(),
      injectJQuery: true,
      maxRequestsPerCrawl: 6,
      // Cartlow blocks datacenter IPs; residential AE passes (validated)
      proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'], apifyProxyCountry: 'AE' },
    },
  },
  revibe: {
    source: 'revibe',
    actorId: CHEERIO_ACTOR,
    input: {
      startUrls: [
        { url: 'https://revibe.me/collections/smartphones' },
        { url: 'https://revibe.me/collections/all' },
      ],
      pageFunction: cheerioPageFunction(),
      maxRequestsPerCrawl: 10,
      proxyConfiguration: { useApifyProxy: true },
    },
  },
};

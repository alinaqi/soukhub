import { describe, it, expect } from 'vitest';
import {
  mapAmazonItem,
  mapCartlowItem,
  mapItems,
  inferBrand,
  inferCategory,
  inferCondition,
} from '@/lib/ingestion/mappers';

/** ADR 0016 — scraped-data mappers must be defensive and deduplicating. */

describe('mapAmazonItem', () => {
  const raw = {
    title: 'Apple iPhone 15 Pro (256 GB) - Natural Titanium',
    asin: 'B0CHX3QBCH',
    url: 'https://www.amazon.ae/dp/B0CHX3QBCH',
    price: { value: 4399, currency: 'AED' },
    thumbnailImage: 'https://m.media-amazon.com/images/I/81fO2C9cYjL._AC_SX679_.jpg',
    brand: 'Apple',
    stars: 4.6,
    reviewsCount: 1250,
  };

  it('maps a full item', () => {
    const item = mapAmazonItem(raw)!;
    expect(item.source).toBe('amazon');
    expect(item.source_id).toBe('B0CHX3QBCH');
    expect(item.price).toBe(4399);
    expect(item.category).toBe('phones');
    expect(item.condition).toBe('new');
    expect(item.images).toHaveLength(1);
  });

  it('drops items without title or asin', () => {
    expect(mapAmazonItem({ ...raw, title: '' })).toBeNull();
    expect(mapAmazonItem({ ...raw, asin: undefined })).toBeNull();
  });

  it('survives price as string or missing', () => {
    expect(mapAmazonItem({ ...raw, price: 'AED 3,999.00' })!.price).toBe(3999);
    expect(mapAmazonItem({ ...raw, price: undefined })!.price).toBeNull();
  });

  it('detects Renewed condition from the title', () => {
    const item = mapAmazonItem({ ...raw, title: 'Apple iPhone 13 (Renewed) 128GB' })!;
    expect(item.condition).toBe('renewed');
  });
});

describe('mapCartlowItem', () => {
  it('maps a generic scraped item and infers brand/category', () => {
    const item = mapCartlowItem({
      title: 'Samsung Galaxy S23 Ultra 512GB - Excellent',
      url: 'https://cartlow.com/uae/en/product/12345',
      price: '2,149',
      image: 'https://cdn.cartlow.com/12345.jpg',
    })!;
    expect(item.source).toBe('cartlow');
    expect(item.brand).toBe('Samsung');
    expect(item.category).toBe('phones');
    expect(item.condition).toBe('excellent');
    expect(item.price).toBe(2149);
  });
});

describe('mapItems', () => {
  it('deduplicates by source_id and drops broken rows', () => {
    const items = mapItems('amazon', [
      { title: 'iPhone 15', asin: 'A1', url: 'https://a/1' },
      { title: 'iPhone 15 dup', asin: 'A1', url: 'https://a/1' },
      { title: '', asin: 'A2', url: 'https://a/2' },
      { title: 'Galaxy S24', asin: 'A3', url: 'https://a/3' },
    ]);
    expect(items.map((i) => i.source_id)).toEqual(['A1', 'A3']);
  });
});

describe('inference helpers', () => {
  it('infers brands from product names', () => {
    expect(inferBrand('AirPods Pro 2')).toBe('Apple');
    expect(inferBrand('Galaxy Tab S9')).toBe('Samsung');
    expect(inferBrand('Pixel 9 Pro')).toBe('Google');
    expect(inferBrand('Some Unknown Gadget')).toBeNull();
  });

  it('infers categories', () => {
    expect(inferCategory('MacBook Air M3 13-inch')).toBe('laptops');
    expect(inferCategory('Sony PlayStation 5 Slim')).toBe('gaming');
    expect(inferCategory('Galaxy Watch 6')).toBe('wearables');
  });

  it('infers conditions', () => {
    expect(inferCondition('iPhone 12 (Renewed)')).toBe('renewed');
    expect(inferCondition('Very Good condition')).toBe('very_good');
    expect(inferCondition(null)).toBeNull();
  });
});

describe('mapAmazonItem imageUrl variant', () => {
  it('accepts the imageUrl field the live actor returns', () => {
    const item = mapAmazonItem({
      title: 'HONOR X5c Plus 4G Smartphone',
      asin: 'B0X1',
      url: 'https://www.amazon.ae/dp/B0X1',
      imageUrl: 'https://m.media-amazon.com/images/I/61exS6m4ZGL._AC_UL320_.jpg',
    })!;
    expect(item.images).toHaveLength(1);
  });
});

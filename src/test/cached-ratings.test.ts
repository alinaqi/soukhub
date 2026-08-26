import { describe, it, expect } from 'vitest';
import { attachRating } from '@/lib/reviews/cached';
import { productReviewKey } from '@/lib/reviews/gemini';

describe('attachRating', () => {
  const ratings = new Map([
    [productReviewKey('Apple', 'iPhone 15 128GB Blue'), { rating: 4.5, review_count: 900 }],
  ]);

  it('attaches by product family regardless of variant', () => {
    const out = attachRating(
      [{ brand: 'Apple', name: 'Apple iPhone 15 256 GB - Pink' } as never],
      ratings
    );
    expect(out[0]).toMatchObject({ rating: 4.5, review_count: 900 });
  });

  it('handles catalog title field and leaves unrated items untouched', () => {
    const out = attachRating(
      [
        { brand: 'Apple', title: 'iPhone 15 128GB' } as never,
        { brand: 'Nokia', title: 'Nokia 3310' } as never,
      ],
      ratings
    );
    expect(out[0]).toMatchObject({ rating: 4.5 });
    expect((out[1] as { rating?: number }).rating).toBeUndefined();
  });
});

describe('family key ignores SKU suffixes', () => {
  it('matches names carrying long numeric suffixes', () => {
    expect(productReviewKey('Apple', 'iPhone 13 128GB Blue 1787730088994')).toBe(
      productReviewKey('Apple', 'iPhone 13 128GB Blue')
    );
  });
});

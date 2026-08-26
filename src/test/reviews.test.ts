import { describe, it, expect, vi } from 'vitest';
import { parseReviewJson, productReviewKey, fetchWebReviews } from '@/lib/reviews/gemini';

describe('productReviewKey', () => {
  it('collapses storage and color variants into one family', () => {
    const a = productReviewKey('Apple', 'Apple iPhone 15 128GB - Blue');
    const b = productReviewKey('Apple', 'Apple iPhone 15 256 GB - Pink');
    expect(a).toBe(b);
  });
  it('collapses renewed markers', () => {
    expect(productReviewKey('Apple', 'iPhone 13 (Renewed)')).toBe(
      productReviewKey('Apple', 'iPhone 13')
    );
  });
});

describe('parseReviewJson', () => {
  it('parses clean JSON and clamps values', () => {
    const parsed = parseReviewJson(
      'Here you go: {"rating": 4.44, "review_count": 1234.7, "summary": "Great phone.", "quotes": [{"text": "Battery life is superb", "source": "TechRadar"}]}'
    )!;
    expect(parsed.rating).toBe(4.4);
    expect(parsed.review_count).toBe(1235);
    expect(parsed.quotes[0].source).toBe('TechRadar');
  });
  it('rejects out-of-range ratings and junk quotes', () => {
    const parsed = parseReviewJson('{"rating": 9, "quotes": [{"text": ""}, "junk"]}')!;
    expect(parsed.rating).toBeNull();
    expect(parsed.quotes).toHaveLength(0);
  });
  it('returns null when no JSON present', () => {
    expect(parseReviewJson('sorry, nothing found')).toBeNull();
  });
});

describe('fetchWebReviews', () => {
  it('sends a grounded request and parses the reply', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: '{"rating": 4.2, "review_count": 500, "summary": "s", "quotes": []}' }] } },
        ],
      }),
    });
    const out = await fetchWebReviews('iPhone 15', fetchMock as unknown as typeof fetch);
    expect(out?.rating).toBe(4.2);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.tools).toEqual([{ google_search: {} }]);
  });
  it('returns null on API failure', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    expect(await fetchWebReviews('x', fetchMock as unknown as typeof fetch)).toBeNull();
  });
});

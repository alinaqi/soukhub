import { describe, it, expect, vi, afterEach } from 'vitest';
import { bannerPrompt, generateCreative } from '@/lib/marketplace/sketch';

describe('bannerPrompt', () => {
  it('names the event, offer and category, and forbids Arabic', () => {
    const p = bannerPrompt({ eventName: 'Back to School', category: 'laptops', discountPct: 20 });
    expect(p).toContain('Back to School');
    expect(p).toContain('up to 20% off');
    expect(p).toContain('laptops');
    expect(p).toMatch(/English text ONLY/);
  });

  it('falls back gracefully with no category or discount', () => {
    const p = bannerPrompt({ eventName: 'White Friday', category: null, discountPct: null });
    expect(p).toContain('White Friday');
    expect(p).toContain('seasonal deals');
    expect(p).toContain('phones, laptops and electronics');
  });
});

describe('generateCreative', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns the artifact image url and html', async () => {
    process.env.SKETCH_API_KEY = 'sk_test';
    process.env.SKETCH_BRAND_ID = 'brand_1';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ artifact: { url: 'https://cdn/x.jpeg', html: '<div/>' } }), {
        status: 200,
      })
    );
    const out = await generateCreative('hi');
    expect(out.image_url).toBe('https://cdn/x.jpeg');
    expect(out.html).toBe('<div/>');
  });

  it('throws when Sketch reports an error or no image', async () => {
    process.env.SKETCH_API_KEY = 'sk_test';
    process.env.SKETCH_BRAND_ID = 'brand_1';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ artifact: {} }), { status: 200 })
    );
    await expect(generateCreative('hi')).rejects.toThrow(/no image/);
  });

  it('requires SKETCH_BRAND_ID', async () => {
    process.env.SKETCH_API_KEY = 'sk_test';
    delete process.env.SKETCH_BRAND_ID;
    await expect(generateCreative('hi')).rejects.toThrow(/SKETCH_BRAND_ID/);
  });
});

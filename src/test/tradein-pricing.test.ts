import { describe, it, expect } from 'vitest';
import {
  valueDevice,
  exchangeOptions,
  median,
  roundAED,
  type DeviceAssessment,
} from '@/lib/tradein/pricing';

/** ADR 0016 — trade-in valuation math. */

const GOOD_IPHONE: DeviceAssessment = {
  identified: true,
  brand: 'Apple',
  model: 'iPhone 13',
  storage: '128GB',
  condition_grade: 'good',
  defects: ['light scratches on frame'],
  confidence: 0.9,
};

describe('median / roundAED', () => {
  it('computes medians and ignores junk', () => {
    expect(median([2000, 1000, 3000])).toBe(2000);
    expect(median([1000, 2000, 3000, 4000])).toBe(2500);
    expect(median([0, -5, NaN])).toBeNull();
  });
  it('rounds to friendly steps', () => {
    expect(roundAED(1234)).toBe(1230);
    expect(roundAED(1235.5)).toBe(1240);
  });
});

describe('valueDevice', () => {
  it('values from new-price comparables with condition factor', () => {
    const v = valueDevice(GOOD_IPHONE, [
      { price: 2400, condition: 'new' },
      { price: 2600, condition: 'new' },
      { price: 2500, condition: 'renewed' },
    ])!;
    expect(v.basis).toBe('new_prices');
    expect(v.market_reference).toBe(2500);
    // good = 0.52 factor → resale 1300; trade-in = 75% → 980 (rounded to 10)
    expect(v.resale_estimate).toBe(1300);
    expect(v.trade_in_value).toBe(980);
  });

  it('falls back to same-condition used prices', () => {
    const v = valueDevice(GOOD_IPHONE, [
      { price: 1500, condition: 'good' },
      { price: 1400, condition: 'good' },
    ])!;
    expect(v.basis).toBe('used_prices');
    expect(v.trade_in_value).toBe(roundAED(1450 * 0.75));
  });

  it('degrades to zero with no comparables (still an answer)', () => {
    const v = valueDevice(GOOD_IPHONE, [])!;
    expect(v.basis).toBe('none');
    expect(v.trade_in_value).toBe(0);
  });

  it('returns null for unidentified devices', () => {
    expect(valueDevice({ ...GOOD_IPHONE, identified: false }, [])).toBeNull();
  });

  it('worse condition means lower value', () => {
    const comps = [{ price: 3000, condition: 'new' as const }];
    const excellent = valueDevice({ ...GOOD_IPHONE, condition_grade: 'excellent' }, comps)!;
    const fair = valueDevice({ ...GOOD_IPHONE, condition_grade: 'fair' }, comps)!;
    expect(excellent.trade_in_value).toBeGreaterThan(fair.trade_in_value);
  });
});

describe('exchangeOptions', () => {
  it('computes top-ups and sorts by closeness', () => {
    const opts = exchangeOptions(1000, [
      { id: 'a', price: 3500 },
      { id: 'b', price: 1150 },
      { id: 'c', price: 800 },
    ]);
    expect(opts[0].id).toBe('b');
    expect(opts[0].top_up).toBe(150);
    const c = opts.find((o) => o.id === 'c')!;
    expect(c.top_up).toBe(-200); // buyer receives money
  });

  it('drops junk prices and respects the limit', () => {
    const opts = exchangeOptions(500, [
      { id: 'x', price: 0 },
      ...Array.from({ length: 10 }, (_, i) => ({ id: `p${i}`, price: 600 + i * 100 })),
    ], 3);
    expect(opts).toHaveLength(3);
    expect(opts.every((o) => o.id !== 'x')).toBe(true);
  });
});

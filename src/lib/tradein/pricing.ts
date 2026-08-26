/**
 * Trade-in valuation (ADR 0016). Pure functions: comparables in, value out —
 * fully unit-testable, no I/O.
 */

export interface Comparable {
  price: number;
  condition: string | null; // new | renewed | excellent | very_good | good | fair
}

export interface DeviceAssessment {
  identified: boolean;
  brand: string | null;
  model: string | null;
  storage: string | null;
  condition_grade: 'excellent' | 'very_good' | 'good' | 'fair' | 'poor';
  defects: string[];
  confidence: number; // 0..1
}

/** Resale value as a fraction of the comparable-new market price. */
const CONDITION_FACTOR: Record<DeviceAssessment['condition_grade'], number> = {
  excellent: 0.7,
  very_good: 0.62,
  good: 0.52,
  fair: 0.38,
  poor: 0.2,
};

/** Platform margin between resale estimate and the trade-in offer. */
const TRADE_IN_MARGIN = 0.75;

export function median(values: number[]): number | null {
  const v = values.filter((n) => isFinite(n) && n > 0).sort((a, b) => a - b);
  if (v.length === 0) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

/** Round to a friendly AED step (nearest 10). */
export function roundAED(value: number): number {
  return Math.max(0, Math.round(value / 10) * 10);
}

export interface Valuation {
  market_reference: number;
  resale_estimate: number;
  trade_in_value: number;
  comparables_used: number;
  basis: 'new_prices' | 'used_prices' | 'none';
}

/**
 * Value a device from market comparables:
 * - prefer new/renewed comparables as the reference, apply condition factor
 * - fall back to same-condition used prices when no new prices exist
 */
export function valueDevice(
  assessment: DeviceAssessment,
  comparables: Comparable[]
): Valuation | null {
  if (!assessment.identified) return null;

  const newish = comparables.filter(
    (c) => c.condition === 'new' || c.condition === 'renewed' || c.condition === null
  );
  const sameCondition = comparables.filter((c) => c.condition === assessment.condition_grade);

  const newMedian = median(newish.map((c) => c.price));
  if (newMedian != null) {
    const resale = newMedian * CONDITION_FACTOR[assessment.condition_grade];
    return {
      market_reference: roundAED(newMedian),
      resale_estimate: roundAED(resale),
      trade_in_value: roundAED(resale * TRADE_IN_MARGIN),
      comparables_used: newish.length,
      basis: 'new_prices',
    };
  }

  const usedMedian = median(sameCondition.map((c) => c.price));
  if (usedMedian != null) {
    return {
      market_reference: roundAED(usedMedian),
      resale_estimate: roundAED(usedMedian),
      trade_in_value: roundAED(usedMedian * TRADE_IN_MARGIN),
      comparables_used: sameCondition.length,
      basis: 'used_prices',
    };
  }

  return {
    market_reference: 0,
    resale_estimate: 0,
    trade_in_value: 0,
    comparables_used: 0,
    basis: 'none',
  };
}

export interface ExchangeCandidate {
  id: string;
  price: number;
}

export interface ExchangeOption extends ExchangeCandidate {
  top_up: number; // positive: buyer pays; negative: buyer receives
}

/** Compute top-up amounts for exchanging the device against listings. */
export function exchangeOptions(
  tradeInValue: number,
  candidates: ExchangeCandidate[],
  limit = 6
): ExchangeOption[] {
  return candidates
    .filter((c) => isFinite(c.price) && c.price > 0)
    // top-up may be negative (buyer receives money) — round, don't clamp
    .map((c) => ({ ...c, top_up: Math.round((c.price - tradeInValue) / 10) * 10 }))
    .sort((a, b) => Math.abs(a.top_up) - Math.abs(b.top_up))
    .slice(0, limit);
}

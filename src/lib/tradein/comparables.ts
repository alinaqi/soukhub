import { createClient } from '@supabase/supabase-js';
import type { DeviceAssessment, Comparable, ExchangeCandidate } from './pricing';

/** Market comparables + exchange candidates for a device (server-side). */

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function deviceQuery(a: DeviceAssessment): string {
  return [a.brand, a.model, a.storage].filter(Boolean).join(' ');
}

export async function findComparables(a: DeviceAssessment): Promise<Comparable[]> {
  const q = deviceQuery(a);
  if (!q) return [];
  const [catalog, listings] = await Promise.all([
    svc().rpc('search_catalog', { p_query: q, p_limit: 20 }),
    svc().rpc('search_listings', { p_query: q, p_limit: 20 }),
  ]);
  const rows: Comparable[] = [];
  for (const r of catalog.data ?? []) {
    if (r.price != null) rows.push({ price: Number(r.price), condition: r.condition ?? null });
  }
  for (const r of listings.data ?? []) {
    if (r.base_price != null) rows.push({ price: Number(r.base_price), condition: null });
  }
  return rows;
}

export interface ExchangeListing extends ExchangeCandidate {
  name: string;
  title_ar: string | null;
  slug: string;
  short_id: string;
  images: string[] | null;
  store_name?: string;
}

/** Live SoukHub listings the device could be exchanged against. */
export async function findExchangeCandidates(a: DeviceAssessment): Promise<ExchangeListing[]> {
  const { data } = await svc().rpc('search_listings', {
    p_query: a.brand ?? '',
    p_category: 'phones',
    p_limit: 24,
  });
  const rows = (data ?? []) as Array<{
    id: string; name: string; title_ar: string | null; base_price: number | null;
    slug: string; short_id: string; images: string[] | null; store_name?: string;
  }>;
  const primary = rows.filter((r) => r.base_price != null);
  if (primary.length >= 3) {
    return primary.map((r) => ({ ...r, price: Number(r.base_price) }));
  }
  // brand too narrow → widen to all published phones
  const { data: wide } = await svc().rpc('search_listings', { p_query: '', p_limit: 24 });
  return ((wide ?? []) as typeof rows)
    .filter((r) => r.base_price != null)
    .map((r) => ({ ...r, price: Number(r.base_price) }));
}

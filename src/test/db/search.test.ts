import { describe, it, expect, beforeAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { serviceClient, anonClient, userClient, localStackUp } from './helpers';

/**
 * TODO-044 — search_listings(): FTS + trigram + filters over published products
 * (ADR 0013). Anon-invoked; RLS keeps drafts/unpublished stores out.
 */

const up = await localStackUp();
const d = describe.skipIf(!up);

const ts = Date.now();
let svc: SupabaseClient;
const ids: Record<string, string> = {};

async function seed(org: string, user: string, rows: Array<Partial<Record<string, unknown>> & { name: string }>) {
  for (const row of rows) {
    const { data, error } = await svc
      .from('products')
      .insert({ org_id: org, user_id: user, is_published: true, ...row })
      .select('id')
      .single();
    if (error) throw error;
    ids[row.name] = data.id;
  }
}

beforeAll(async () => {
  if (!up) return;
  svc = serviceClient();
  const seller = await userClient(`search-seller-${ts}@test.local`);
  const { data: orgId, error } = await svc.rpc('ensure_org_for_user', { p_user_id: seller.userId });
  if (error) throw error;
  await svc.from('organizations').update({ is_published: true }).eq('id', orgId);

  await seed(orgId as string, seller.userId, [
    { name: `iPhone 13 128GB Blue ${ts}`, brand: 'Apple', category: 'phones', base_price: 1699, title_ar: 'ايفون 13 ازرق' },
    { name: `iPhone 13 Pro Max 256GB ${ts}`, brand: 'Apple', category: 'phones', base_price: 2899 },
    { name: `Samsung Galaxy S24 Ultra ${ts}`, brand: 'Samsung', category: 'phones', base_price: 3499 },
    { name: `AirPods Pro 2 ${ts}`, brand: 'Apple', category: 'audio', base_price: 799 },
    { name: `Secret draft phone ${ts}`, brand: 'Apple', category: 'phones', base_price: 999, is_published: false },
  ]);

  // Published product inside an UNPUBLISHED store must never surface
  const hidden = await userClient(`search-hidden-${ts}@test.local`);
  const { data: hiddenOrg } = await svc.rpc('ensure_org_for_user', { p_user_id: hidden.userId });
  await seed(hiddenOrg as string, hidden.userId, [
    { name: `Hidden store iPhone 13 ${ts}`, brand: 'Apple', category: 'phones', base_price: 1500 },
  ]);
}, 60_000);

function names(rows: Array<{ name: string }> | null) {
  return (rows ?? []).map((r) => r.name);
}

d('search_listings', () => {
  it('finds by exact text', async () => {
    const { data, error } = await anonClient().rpc('search_listings', { p_query: 'iPhone 13' });
    expect(error).toBeNull();
    const found = names(data);
    expect(found.some((n) => n.startsWith('iPhone 13 128GB'))).toBe(true);
    expect(found.some((n) => n.startsWith('iPhone 13 Pro Max'))).toBe(true);
  });

  it('survives typos via trigram fallback', async () => {
    const { data } = await anonClient().rpc('search_listings', { p_query: 'iphon 13' });
    expect(names(data).some((n) => n.includes('iPhone 13'))).toBe(true);
  });

  it('finds Arabic content', async () => {
    const { data } = await anonClient().rpc('search_listings', { p_query: 'ايفون' });
    expect(names(data).some((n) => n.startsWith('iPhone 13 128GB'))).toBe(true);
  });

  it('applies brand and price filters together', async () => {
    const { data } = await anonClient().rpc('search_listings', {
      p_query: '',
      p_brand: 'Apple',
      p_max_price: 1000,
    });
    const found = names(data);
    expect(found.some((n) => n.startsWith('AirPods Pro 2'))).toBe(true);
    expect(found.every((n) => !n.includes('Samsung'))).toBe(true);
    expect(found.every((n) => !n.includes('Pro Max'))).toBe(true);
  });

  it('filters by category', async () => {
    const { data } = await anonClient().rpc('search_listings', { p_query: '', p_category: 'audio' });
    expect(names(data).some((n) => n.startsWith('AirPods'))).toBe(true);
    expect(names(data).every((n) => !n.includes('iPhone'))).toBe(true);
  });

  it('never returns drafts', async () => {
    const { data } = await anonClient().rpc('search_listings', { p_query: 'Secret draft phone' });
    expect(names(data).every((n) => !n.includes('Secret draft'))).toBe(true);
  });

  it('never returns products of unpublished stores', async () => {
    const { data } = await anonClient().rpc('search_listings', { p_query: 'Hidden store iPhone' });
    expect(names(data).every((n) => !n.includes('Hidden store'))).toBe(true);
  });

  it('returns store slug and short_id for URL building', async () => {
    const { data } = await anonClient().rpc('search_listings', { p_query: 'AirPods' });
    const row = (data ?? []).find((r: { name: string }) => r.name.startsWith('AirPods'));
    expect(row?.store_slug).toBeTruthy();
    expect(row?.short_id).toMatch(/^[a-z0-9]{8}$/);
    expect(row?.slug).toBeTruthy();
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { serviceClient, anonClient, userClient, localStackUp } from './helpers';

/**
 * Seller-run deals: org members create time-boxed deal prices on their own
 * published products; live deals are public and promoted marketplace-wide.
 */

const up = await localStackUp();
const d = describe.skipIf(!up);

type DealsService = typeof import('@/lib/marketplace/deals-service');
let svc: DealsService;

const ts = Date.now();
let ownerId: string;
let strangerId: string;
let orgId: string;
let productId: string;

const future = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

beforeAll(async () => {
  if (!up) return;
  const out = execSync('supabase status -o env', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const get = (n: string) => out.match(new RegExp(`^${n}="([^"]+)"`, 'm'))?.[1];
  process.env.NEXT_PUBLIC_SUPABASE_URL = get('API_URL');
  process.env.SUPABASE_SERVICE_ROLE_KEY = get('SECRET_KEY') ?? get('SERVICE_ROLE_KEY');
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = get('PUBLISHABLE_KEY') ?? get('ANON_KEY');
  svc = await import('@/lib/marketplace/deals-service');

  const s = serviceClient();
  ownerId = (await userClient(`deal-owner-${ts}@test.local`)).userId;
  strangerId = (await userClient(`deal-stranger-${ts}@test.local`)).userId;
  await s.rpc('ensure_org_for_user', { p_user_id: strangerId });
  const { data: org } = await s.rpc('ensure_org_for_user', { p_user_id: ownerId });
  orgId = org as string;
  await s.from('organizations').update({ is_published: true }).eq('id', orgId);
  const { data: p } = await s
    .from('products')
    .insert({
      org_id: orgId, user_id: ownerId, name: `Deal Phone ${ts}`,
      base_price: 2000, is_published: true,
    })
    .select('id')
    .single();
  productId = p!.id;
}, 60_000);

d('createDeal', () => {
  it('rejects prices at or above base price, non-positive, and past end dates', async () => {
    expect((await svc.createDeal(ownerId, { product_id: productId, deal_price: 2000, ends_at: future(24) })).ok).toBe(false);
    expect((await svc.createDeal(ownerId, { product_id: productId, deal_price: 0, ends_at: future(24) })).ok).toBe(false);
    expect((await svc.createDeal(ownerId, { product_id: productId, deal_price: 1500, ends_at: future(-2) })).ok).toBe(false);
  });

  it("rejects another org's product", async () => {
    const res = await svc.createDeal(strangerId, { product_id: productId, deal_price: 1500, ends_at: future(24) });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.status).toBe(404);
  });

  it('creates a live deal that is publicly readable', async () => {
    const res = await svc.createDeal(ownerId, { product_id: productId, deal_price: 1499, ends_at: future(48) });
    expect(res.ok).toBe(true);
    const { data } = await anonClient().from('deals').select('deal_price').eq('product_id', productId);
    expect(data).toHaveLength(1);
    expect(Number(data![0].deal_price)).toBe(1499);
  });

  it('only one live deal per product (409 on second)', async () => {
    const res = await svc.createDeal(ownerId, { product_id: productId, deal_price: 1399, ends_at: future(24) });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.status).toBe(409);
  });
});

d('endDeal + public listing', () => {
  it('lists the live deal with product info via listSellerDeals', async () => {
    const rows = await svc.listSellerDeals(10);
    const mine = rows.find((r) => r.product.id === productId);
    expect(mine).toBeTruthy();
    expect(mine!.deal_price).toBe(1499);
    expect(mine!.product.base_price).toBe(2000);
    expect(mine!.product.name).toContain('Deal Phone');
  });

  it('ending a deal hides it from the public and allows a new one', async () => {
    const ended = await svc.endDeal(ownerId, productId);
    expect(ended.ok).toBe(true);
    const { data } = await anonClient().from('deals').select('id').eq('product_id', productId);
    expect(data).toHaveLength(0);
    const again = await svc.createDeal(ownerId, { product_id: productId, deal_price: 1450, ends_at: future(24) });
    expect(again.ok).toBe(true);
  });

  it('a naturally-expired deal does not block a new deal (deadlock fix)', async () => {
    const s = serviceClient();
    // Force the live deal into a lapsed-but-active state
    const { error } = await s.from('deals').update({
      starts_at: new Date(Date.now() - 7200_000).toISOString(),
      ends_at: new Date(Date.now() - 3600_000).toISOString(),
    }).eq('product_id', productId).eq('is_active', true);
    expect(error).toBeNull();
    const res = await svc.createDeal(ownerId, { product_id: productId, deal_price: 1425, ends_at: future(24) });
    expect(res.ok).toBe(true);
  });

  it('RLS blocks cross-tenant deal injection (org_id ≠ product org)', async () => {
    const s = serviceClient();
    const { data: rivalOrg } = await s.rpc('ensure_org_for_user', { p_user_id: strangerId });
    const rival = await userClient(`deal-stranger-${ts}@test.local`);
    const { error } = await rival.client.from('deals').insert({
      org_id: rivalOrg as string,
      product_id: productId, // victim's product
      deal_price: 1,
      ends_at: future(24),
    });
    expect(error).not.toBeNull();
  });

  it('expired-window deals are not publicly visible', async () => {
    const s = serviceClient();
    const { error } = await s.from('deals').update({
      starts_at: new Date(Date.now() - 7200_000).toISOString(),
      ends_at: new Date(Date.now() - 3600_000).toISOString(),
    }).eq('product_id', productId).eq('is_active', true);
    expect(error).toBeNull();
    const { data } = await anonClient().from('deals').select('id').eq('product_id', productId);
    expect(data).toHaveLength(0);
  });
});

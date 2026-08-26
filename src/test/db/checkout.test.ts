import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { serviceClient, userClient, localStackUp } from './helpers';

/** Buy online v1 — buyer orders land in the seller's real ops pipeline. */

const up = await localStackUp();
const d = describe.skipIf(!up);

type Checkout = typeof import('@/lib/checkout/service');
let mod: Checkout;
const ts = Date.now();
let productId: string;
let sellerId: string;

beforeAll(async () => {
  if (!up) return;
  const out = execSync('supabase status -o env', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const get = (n: string) => out.match(new RegExp(`^${n}="([^"]+)"`, 'm'))?.[1];
  process.env.NEXT_PUBLIC_SUPABASE_URL = get('API_URL');
  process.env.SUPABASE_SERVICE_ROLE_KEY = get('SECRET_KEY') ?? get('SERVICE_ROLE_KEY');
  mod = await import('@/lib/checkout/service');

  const svc = serviceClient();
  const seller = await userClient(`checkout-seller-${ts}@test.local`);
  sellerId = seller.userId;
  const { data: orgId } = await svc.rpc('ensure_org_for_user', { p_user_id: sellerId });
  await svc.from('organizations').update({ is_published: true }).eq('id', orgId);
  const { data: p } = await svc
    .from('products')
    .insert({ org_id: orgId, user_id: sellerId, name: `Checkout iPhone ${ts}`, base_price: 1500, is_published: true })
    .select('id')
    .single();
  productId = p!.id;
}, 60_000);

const BUYER = { name: 'Aisha Buyer', phone: '+971 50 555 0001', emirate: 'Dubai', address: 'Villa 12, Al Barsha 2' };

d('createBuyerOrder', () => {
  it('creates a pending COD order with items in the seller org', async () => {
    const res = await mod.createBuyerOrder({ product_id: productId, quantity: 2, buyer: BUYER });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.ref).toMatch(/^SH-[A-Z2-9]{6}$/);
    expect(res.total).toBe(3000);

    const svc = serviceClient();
    const { data: order } = await svc
      .from('orders')
      .select('marketplace, status, payment_method, total, user_id, customer_phone')
      .eq('marketplace_order_id', res.ref)
      .single();
    expect(order!.marketplace).toBe('soukhub');
    expect(order!.status).toBe('pending');
    expect(order!.payment_method).toBe('cod');
    expect(Number(order!.total)).toBe(3000);
    expect(order!.user_id).toBe(sellerId);
  });

  it('validates buyer fields', async () => {
    const bad = await mod.createBuyerOrder({ product_id: productId, buyer: { ...BUYER, phone: '123' } });
    expect(bad).toMatchObject({ ok: false, status: 400, error: 'phone_invalid' });
    const noAddr = await mod.createBuyerOrder({ product_id: productId, buyer: { ...BUYER, address: '' } });
    expect(noAddr).toMatchObject({ ok: false, status: 400 });
  });

  it('rejects unpublished products', async () => {
    const svc = serviceClient();
    const { data: draft } = await svc
      .from('products')
      .insert({ user_id: sellerId, name: `Draft ${ts}`, base_price: 100, is_published: false })
      .select('id')
      .single();
    const res = await mod.createBuyerOrder({ product_id: draft!.id, buyer: BUYER });
    expect(res).toMatchObject({ ok: false, status: 404 });
  });
});

d('lookupOrder', () => {
  it('finds an order by ref + matching phone; rejects wrong phone', async () => {
    const created = await mod.createBuyerOrder({ product_id: productId, buyer: BUYER });
    if (!created.ok) throw new Error('setup failed');
    const found = await mod.lookupOrder(created.ref, '0505550001');
    expect(found?.status).toBe('pending');
    const wrong = await mod.lookupOrder(created.ref, '0509999999');
    expect(wrong).toBeNull();
  });
});

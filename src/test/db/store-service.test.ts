import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { serviceClient, userClient, localStackUp } from './helpers';

/**
 * TODO-045 — store provisioning, settings updates, publish flow.
 * Points the store-service env at the local stack, then exercises the real
 * service functions (the same code the /api/store routes call).
 */

const up = await localStackUp();
const d = describe.skipIf(!up);

type StoreService = typeof import('@/lib/marketplace/store-service');
let svcMod: StoreService;

const ts = Date.now();
let ownerId: string;
let packerId: string;
let strangerId: string;
let ownOrgId: string;
let productId: string;

beforeAll(async () => {
  if (!up) return;
  const out = execSync('supabase status -o env', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const get = (n: string) => out.match(new RegExp(`^${n}="([^"]+)"`, 'm'))?.[1];
  process.env.NEXT_PUBLIC_SUPABASE_URL = get('API_URL');
  process.env.SUPABASE_SERVICE_ROLE_KEY = get('SECRET_KEY') ?? get('SERVICE_ROLE_KEY');
  svcMod = await import('@/lib/marketplace/store-service');

  const svc = serviceClient();
  const owner = await userClient(`store-owner-${ts}@test.local`);
  ownerId = owner.userId;
  const packer = await userClient(`store-packer-${ts}@test.local`);
  packerId = packer.userId;
  const stranger = await userClient(`store-stranger-${ts}@test.local`);
  strangerId = stranger.userId;

  // Owner store provisioned through the service itself (the API path)
  const store = await svcMod.getStoreForUser(ownerId);
  ownOrgId = store.id;

  await svc.from('team_members').insert({
    user_id: packerId,
    organization_id: ownOrgId,
    owner_user_id: ownerId,
    role: 'packer',
    name: 'Packer',
  });

  const { data: p } = await svc
    .from('products')
    .insert({ org_id: ownOrgId, user_id: ownerId, name: `Pixel 9 ${ts}`, base_price: 1999 })
    .select('id')
    .single();
  productId = p!.id;
}, 60_000);

d('store provisioning', () => {
  it('provisions a store for a fresh user on first access (idempotent)', async () => {
    const again = await svcMod.getStoreForUser(ownerId);
    expect(again.id).toBe(ownOrgId);
    expect(again.role).toBe('owner');
    expect(again.slug).toBeTruthy();
    expect(again.is_published).toBe(false);
  });
});

d('store updates', () => {
  it('rejects reserved and malformed slugs', async () => {
    const reserved = await svcMod.updateStoreForUser(ownerId, { slug: 'search' });
    expect(reserved).toMatchObject({ ok: false, status: 400, error: 'slug_reserved' });
    const bad = await svcMod.updateStoreForUser(ownerId, { slug: 'Bad Slug!' });
    expect(bad).toMatchObject({ ok: false, status: 400, error: 'slug_invalid' });
  });

  it('rejects a slug already taken by another store', async () => {
    const other = await svcMod.getStoreForUser(strangerId);
    const res = await svcMod.updateStoreForUser(ownerId, { slug: other.slug! });
    expect(res).toMatchObject({ ok: false, status: 409, error: 'slug_taken' });
  });

  it('updates name, slug and Arabic fields', async () => {
    const res = await svcMod.updateStoreForUser(ownerId, {
      name: 'Owner Phones',
      name_ar: 'هواتف المالك',
      slug: `owner-phones-${ts}`.slice(0, 40),
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.store.name).toBe('Owner Phones');
      expect(res.store.name_ar).toBe('هواتف المالك');
    }
  });

  it('packers cannot edit the store', async () => {
    const res = await svcMod.updateStoreForUser(packerId, { name: 'Hacked' });
    expect(res).toMatchObject({ ok: false, status: 403 });
  });

  it('cannot publish a store with zero published listings', async () => {
    const res = await svcMod.updateStoreForUser(ownerId, { is_published: true });
    expect(res).toMatchObject({ ok: false, status: 400, error: 'publish_requires_product' });
  });
});

d('publish flow', () => {
  it('cannot publish a product belonging to another store', async () => {
    const res = await svcMod.setProductPublished(strangerId, productId, true);
    expect(res).toMatchObject({ ok: false, status: 404 });
  });

  it('publishing the first product also publishes the store', async () => {
    const res = await svcMod.setProductPublished(ownerId, productId, true);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.product_published).toBe(true);
      expect(res.store_published).toBe(true);
      expect(res.storefront_path).toMatch(/^\/s\//);
    }
    const store = await svcMod.getStoreForUser(ownerId);
    expect(store.is_published).toBe(true);
    expect(store.published_product_count).toBe(1);
  });

  it('after publishing, the store publish toggle works both ways', async () => {
    const off = await svcMod.updateStoreForUser(ownerId, { is_published: false });
    expect(off.ok).toBe(true);
    const on = await svcMod.updateStoreForUser(ownerId, { is_published: true });
    expect(on.ok).toBe(true);
  });
});

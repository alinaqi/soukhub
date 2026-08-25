import { describe, it, expect, beforeAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { serviceClient, anonClient, userClient, localStackUp } from './helpers';

/**
 * TODO-040 — Multi-tenant RLS suite (ADR 0009).
 * Runs against the local Supabase stack; auto-skips when it is not running
 * (CI has no database service yet — tracked in TODO-061 follow-ups).
 */

const up = await localStackUp();
const d = describe.skipIf(!up);

const ts = Date.now();
const A_EMAIL = `tenant-a-${ts}@test.local`;
const B_EMAIL = `tenant-b-${ts}@test.local`;
const A2_EMAIL = `tenant-a2-${ts}@test.local`;

let svc: SupabaseClient;
let aClient: SupabaseClient;
let bClient: SupabaseClient;
let a2Client: SupabaseClient;
let orgA: string;
let orgB: string;
let productA: string;
let productBDraft: string;
let productBPublished: string;
let bUserId: string;

beforeAll(async () => {
  if (!up) return;
  svc = serviceClient();
  const a = await userClient(A_EMAIL);
  const b = await userClient(B_EMAIL);
  const a2 = await userClient(A2_EMAIL);
  aClient = a.client;
  bClient = b.client;
  bUserId = b.userId;
  a2Client = a2.client;

  // Orgs are created by the backfill for pre-existing users; new users get one
  // via ensure_org_for_user(). Call it for our fresh test users.
  const { data: orgAData, error: e1 } = await svc.rpc('ensure_org_for_user', {
    p_user_id: a.userId,
  });
  if (e1) throw e1;
  orgA = orgAData as string;
  const { data: orgBData, error: e2 } = await svc.rpc('ensure_org_for_user', {
    p_user_id: b.userId,
  });
  if (e2) throw e2;
  orgB = orgBData as string;

  // Second member of org A (manager)
  await svc.from('team_members').insert({
    user_id: a2.userId,
    organization_id: orgA,
    owner_user_id: a.userId,
    role: 'manager',
    name: 'Second Member',
  });

  // Publish org B's store; org A stays unpublished
  await svc.from('organizations').update({ is_published: true, slug: `org-b-${ts}` }).eq('id', orgB);

  const mk = (org: string, user: string, name: string, published: boolean) => ({
    org_id: org,
    user_id: user,
    name,
    brand: 'Apple',
    category: 'phones',
    base_price: 1999,
    is_published: published,
  });

  const { data: pa, error: pe } = await svc
    .from('products')
    .insert(mk(orgA, a.userId, `iPhone 15 Pro A ${ts}`, true))
    .select('id')
    .single();
  if (pe) throw pe;
  productA = pa.id;

  const { data: pbd } = await svc
    .from('products')
    .insert(mk(orgB, b.userId, `iPhone 14 B draft ${ts}`, false))
    .select('id')
    .single();
  productBDraft = pbd!.id;

  const { data: pbp } = await svc
    .from('products')
    .insert(mk(orgB, b.userId, `iPhone 13 B live ${ts}`, true))
    .select('id')
    .single();
  productBPublished = pbp!.id;
}, 60_000);

d('org membership & helper', () => {
  it('ensure_org_for_user is idempotent', async () => {
    const { data: again } = await svc.rpc('ensure_org_for_user', {
      p_user_id: (await aClient.auth.getUser()).data.user!.id,
    });
    expect(again).toBe(orgA);
  });

  it('a second member of the org can read its products', async () => {
    const { data } = await a2Client.from('products').select('id').eq('org_id', orgA);
    expect(data?.map((r) => r.id)).toContain(productA);
  });
});

d('cross-tenant isolation', () => {
  it('A cannot read B products (draft or published) through tenant access', async () => {
    const { data } = await aClient
      .from('products')
      .select('id')
      .eq('org_id', orgB)
      .eq('is_published', false);
    expect(data ?? []).toHaveLength(0);
  });

  it('A cannot insert a product into org B', async () => {
    const { error } = await aClient.from('products').insert({
      org_id: orgB,
      user_id: (await aClient.auth.getUser()).data.user!.id,
      name: 'intruder product',
      base_price: 1,
    });
    expect(error).not.toBeNull();
  });

  it('A cannot update a B product', async () => {
    const { data } = await aClient
      .from('products')
      .update({ name: 'hacked' })
      .eq('id', productBPublished)
      .select('id');
    expect(data ?? []).toHaveLength(0);
    const { data: check } = await svc
      .from('products')
      .select('name')
      .eq('id', productBPublished)
      .single();
    expect(check?.name).not.toBe('hacked');
  });

  it('A cannot read B suppliers/orders', async () => {
    const { data: sup } = await aClient.from('suppliers').select('id').eq('org_id', orgB);
    expect(sup ?? []).toHaveLength(0);
    const { data: ord } = await aClient.from('orders').select('id').eq('org_id', orgB);
    expect(ord ?? []).toHaveLength(0);
  });
});

d('public (anon) marketplace access', () => {
  it('anon sees the published product of a published store', async () => {
    const { data } = await anonClient()
      .from('products')
      .select('id, name')
      .eq('id', productBPublished);
    expect(data?.map((r) => r.id)).toContain(productBPublished);
  });

  it('anon does NOT see drafts', async () => {
    const { data } = await anonClient().from('products').select('id').eq('id', productBDraft);
    expect(data ?? []).toHaveLength(0);
  });

  it('anon does NOT see published products of an unpublished store', async () => {
    const { data } = await anonClient().from('products').select('id').eq('id', productA);
    expect(data ?? []).toHaveLength(0);
  });

  it('anon sees published stores only', async () => {
    const anon = anonClient();
    const { data: pub } = await anon.from('organizations').select('id').eq('id', orgB);
    expect(pub?.length).toBe(1);
    const { data: unpub } = await anon.from('organizations').select('id').eq('id', orgA);
    expect(unpub ?? []).toHaveLength(0);
  });

  it('anon cannot read tenant tables', async () => {
    const anon = anonClient();
    for (const table of ['orders', 'suppliers', 'customers', 'inventory']) {
      const { data } = await anon.from(table).select('id').limit(1);
      expect(data ?? [], `anon read ${table}`).toHaveLength(0);
    }
  });
});

d('anon column privileges (sensitive seller data)', () => {
  it('anon cannot read cost/margin or internal columns on published products', async () => {
    const anon = anonClient();
    const { error } = await anon
      .from('products')
      .select('cost_price')
      .eq('id', productBPublished);
    expect(error, 'cost_price must be revoked for anon').not.toBeNull();
    const { error: e2 } = await anon.from('products').select('attributes').limit(1);
    expect(e2, 'attributes must be revoked for anon').not.toBeNull();
  });

  it('anon cannot read owner/commission/settings on published stores', async () => {
    const anon = anonClient();
    for (const col of ['owner_user_id', 'commission_bps', 'settings']) {
      const { error } = await anon.from('organizations').select(col).eq('id', orgB);
      expect(error, `${col} must be revoked for anon`).not.toBeNull();
    }
  });

  it('anon can still read the public listing columns', async () => {
    const anon = anonClient();
    const { data, error } = await anon
      .from('products')
      .select('id, name, title_ar, brand, base_price, images, slug, short_id')
      .eq('id', productBPublished);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('anon cannot call ensure_org_for_user even for a real user', async () => {
    const { error } = await anonClient().rpc('ensure_org_for_user', { p_user_id: bUserId });
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/permission|not exist|denied/i);
  });
});

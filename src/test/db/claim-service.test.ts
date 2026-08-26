import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { serviceClient, userClient, localStackUp } from './helpers';

/**
 * Claim-my-store (ADR 0017 conversion path): a listed provider becomes a
 * seller org owned by the claiming user, exactly once.
 */

const up = await localStackUp();
const d = describe.skipIf(!up);

type ClaimService = typeof import('@/lib/marketplace/claim-service');
let claimMod: ClaimService;

const ts = Date.now();
let ownerId: string;
let rivalId: string;
let providerId: string;

beforeAll(async () => {
  if (!up) return;
  const out = execSync('supabase status -o env', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const get = (n: string) => out.match(new RegExp(`^${n}="([^"]+)"`, 'm'))?.[1];
  process.env.NEXT_PUBLIC_SUPABASE_URL = get('API_URL');
  process.env.SUPABASE_SERVICE_ROLE_KEY = get('SECRET_KEY') ?? get('SERVICE_ROLE_KEY');
  claimMod = await import('@/lib/marketplace/claim-service');

  ownerId = (await userClient(`claim-owner-${ts}@test.local`)).userId;
  rivalId = (await userClient(`claim-rival-${ts}@test.local`)).userId;

  const { data: provider, error } = await serviceClient()
    .from('providers')
    .insert({
      google_place_id: `claim-test-${ts}`,
      name: `Al Falah Mobiles ${ts}`,
      area: 'Deira',
      emirate: 'Dubai',
      image_url: 'https://example.com/shop.jpg',
      is_active: true,
    })
    .select('id')
    .single();
  if (error) throw error;
  providerId = provider!.id;
}, 60_000);

d('claimProvider', () => {
  it('claims a provider, provisions the org, and prefills the store', async () => {
    const res = await claimMod.claimProvider(ownerId, providerId);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.store.name).toBe(`Al Falah Mobiles ${ts}`);
    expect(res.store.logo_url).toBe('https://example.com/shop.jpg');
    expect(res.store_path).toBe('/settings/store');

    const { data: p } = await serviceClient()
      .from('providers')
      .select('claimed_org_id, claimed_at')
      .eq('id', providerId)
      .single();
    expect(p!.claimed_org_id).toBe(res.store.id);
    expect(p!.claimed_at).toBeTruthy();
  });

  it('is idempotent for the same owner', async () => {
    const res = await claimMod.claimProvider(ownerId, providerId);
    expect(res.ok).toBe(true);
  });

  it('rejects a second claimant with 409', async () => {
    const res = await claimMod.claimProvider(rivalId, providerId);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.status).toBe(409);
  });

  it('404s on unknown or inactive providers', async () => {
    const res = await claimMod.claimProvider(ownerId, '00000000-0000-0000-0000-000000000000');
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.status).toBe(404);
  });

  it('does not overwrite an established store name', async () => {
    // rival already has an org with its own identity
    const { data: provider } = await serviceClient()
      .from('providers')
      .insert({
        google_place_id: `claim-test2-${ts}`,
        name: `Second Shop ${ts}`,
        is_active: true,
      })
      .select('id')
      .single();

    const svc = serviceClient();
    const { data: orgId } = await svc.rpc('ensure_org_for_user', { p_user_id: rivalId });
    await svc.from('organizations').update({ is_published: true, name: 'Established Store' })
      .eq('id', orgId as string);

    const res = await claimMod.claimProvider(rivalId, provider!.id);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.store.name).toBe('Established Store');
  });
});

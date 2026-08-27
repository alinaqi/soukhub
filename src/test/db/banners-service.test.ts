import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'node:child_process';
import { localStackUp } from './helpers';

/** Promo banners: save retires the prior live banner and public read returns
 * the latest, with locale fallback to English. */

const up = await localStackUp();
const d = describe.skipIf(!up);

type BannersService = typeof import('@/lib/marketplace/banners-service');
let svc: BannersService;
const slug = `test-event-${Date.now()}`;

beforeAll(async () => {
  if (!up) return;
  const out = execSync('supabase status -o env', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const get = (n: string) => out.match(new RegExp(`^${n}="([^"]+)"`, 'm'))?.[1];
  process.env.NEXT_PUBLIC_SUPABASE_URL = get('API_URL');
  process.env.SUPABASE_SERVICE_ROLE_KEY = get('SECRET_KEY') ?? get('SERVICE_ROLE_KEY');
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = get('PUBLISHABLE_KEY') ?? get('ANON_KEY');
  svc = await import('@/lib/marketplace/banners-service');
});

afterAll(async () => {
  if (!up) return;
  const svcClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  await svcClient.from('promo_banners').delete().eq('event_slug', slug);
});

d('banners-service', () => {
  it('saves a banner and reads it back publicly', async () => {
    await svc.saveBanner({ event_slug: slug, headline: 'Test', image_url: 'https://x/a.jpeg', href: '/search' });
    const b = await svc.getBannerForEvent(slug);
    expect(b?.image_url).toBe('https://x/a.jpeg');
    expect(b?.href).toBe('/search');
  });

  it('a new save retires the previous banner (one live per event)', async () => {
    await svc.saveBanner({ event_slug: slug, headline: 'Test 2', image_url: 'https://x/b.jpeg', href: '/search?category=laptops' });
    const b = await svc.getBannerForEvent(slug);
    expect(b?.image_url).toBe('https://x/b.jpeg');
    expect(b?.href).toBe('/search?category=laptops');
  });

  it('falls back to the English banner when the locale has none', async () => {
    const b = await svc.getBannerForEvent(slug, 'ar');
    expect(b?.image_url).toBe('https://x/b.jpeg'); // en fallback
  });

  it('returns null for an unknown event', async () => {
    expect(await svc.getBannerForEvent('no-such-event')).toBeNull();
  });
});

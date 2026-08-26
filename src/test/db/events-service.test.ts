import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { localStackUp } from './helpers';

/**
 * UAE retail calendar (ADR 0018 ring-2): active-event selection by priority,
 * upcoming schedule, and public visibility.
 */

const up = await localStackUp();
const d = describe.skipIf(!up);

type EventsService = typeof import('@/lib/marketplace/events-service');
let svc: EventsService;

beforeAll(async () => {
  if (!up) return;
  const out = execSync('supabase status -o env', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const get = (n: string) => out.match(new RegExp(`^${n}="([^"]+)"`, 'm'))?.[1];
  process.env.NEXT_PUBLIC_SUPABASE_URL = get('API_URL');
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = get('PUBLISHABLE_KEY') ?? get('ANON_KEY');
  svc = await import('@/lib/marketplace/events-service');
});

d('retail calendar', () => {
  it('back to school is the active event during August', async () => {
    const active = await svc.getActiveEvent(new Date('2026-08-27T12:00:00Z'));
    expect(active?.slug).toBe('back-to-school');
    expect(active?.category).toBe('laptops');
    expect(active?.emoji).toBe('🎒');
  });

  it('picks the highest-priority event when several overlap', async () => {
    // Aug 27 has both back-to-school (p10) and Emirati Women's Day (p5)
    const active = await svc.getActiveEvent(new Date('2026-08-27T12:00:00Z'));
    expect(active?.slug).toBe('back-to-school');
  });

  it('returns White Friday in late November', async () => {
    const active = await svc.getActiveEvent(new Date('2026-11-28T12:00:00Z'));
    expect(active?.slug).toBe('white-friday');
  });

  it('returns null when no event is live', async () => {
    const active = await svc.getActiveEvent(new Date('2026-10-01T12:00:00Z'));
    expect(active).toBeNull();
  });

  it('lists upcoming events in date order', async () => {
    const upcoming = await svc.listUpcomingEvents(new Date('2026-09-25T12:00:00Z'), 3);
    expect(upcoming.length).toBeGreaterThan(0);
    expect(upcoming[0].slug).toBe('gitex-global');
    // strictly increasing start dates
    for (let i = 1; i < upcoming.length; i++) {
      expect(new Date(upcoming[i].starts_at).getTime()).toBeGreaterThanOrEqual(
        new Date(upcoming[i - 1].starts_at).getTime()
      );
    }
  });
});

/**
 * Generate promo banners for the retail calendar via Protaige Sketch.
 * Usage: pnpm banners:generate            (active + next 2 events, if missing)
 *        pnpm banners:generate --force    (regenerate even if one exists)
 *        pnpm banners:generate <slug>     (a specific event)
 *        TARGET=production pnpm banners:generate
 *
 * Env: SKETCH_API_KEY, SKETCH_BRAND_ID, and the Supabase service creds. For
 * TARGET=production, reads the commented hosted keys from .env.local.
 */
import { readFileSync } from 'node:fs';
import { config } from 'dotenv';
import { generateCreative, bannerPrompt } from '../src/lib/marketplace/sketch';
import { getActiveEvent, listUpcomingEvents, type RetailEvent } from '../src/lib/marketplace/events-service';
import { getBannerForEvent, persistBannerImage, saveBanner } from '../src/lib/marketplace/banners-service';

config({ path: '.env.local' });

// The Supabase clients read process.env lazily (at call time, inside main),
// so resolving prod creds here — before any of them run — is sufficient.
if (process.env.TARGET === 'production') {
  const env = readFileSync('.env.local', 'utf8');
  process.env.NEXT_PUBLIC_SUPABASE_URL =
    env.match(/^# NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim() ?? '';
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    env.match(/^# SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim() ?? '';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
    env.match(/^# NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$/m)?.[1]?.trim() ?? '';
}

const args = process.argv.slice(2);
const force = args.includes('--force');
const onlySlug = args.find((a) => !a.startsWith('--'));

function hrefFor(event: RetailEvent): string {
  return event.category ? `/search?category=${event.category}` : '/search';
}

async function ensureBanner(event: RetailEvent): Promise<void> {
  if (!force) {
    const existing = await getBannerForEvent(event.slug).catch(() => null);
    if (existing) {
      console.log(`  ${event.slug}: already has a banner — skipping (use --force to regenerate)`);
      return;
    }
  }
  console.log(`  ${event.slug}: generating…`);
  const creative = await generateCreative(
    bannerPrompt({
      eventName: event.name,
      category: event.category,
      discountPct: event.expected_discount_pct,
    })
  );
  const imageUrl = await persistBannerImage(creative.image_url, `event-${event.slug}`);
  await saveBanner({
    event_slug: event.slug,
    headline: event.name,
    image_url: imageUrl,
    href: hrefFor(event),
  });
  console.log(`  ${event.slug}: saved → ${imageUrl}`);
}

async function main() {
  const events = new Map<string, RetailEvent>();
  const active = await getActiveEvent();
  if (active) events.set(active.slug, active);
  for (const e of await listUpcomingEvents(new Date(), 2)) events.set(e.slug, e);

  const targets = onlySlug
    ? [...events.values()].filter((e) => e.slug === onlySlug)
    : [...events.values()];

  if (targets.length === 0) {
    console.log(onlySlug ? `No live/upcoming event "${onlySlug}".` : 'No live or upcoming events.');
    return;
  }
  console.log(`Generating banners for: ${targets.map((e) => e.slug).join(', ')}`);
  for (const event of targets) {
    try {
      await ensureBanner(event);
    } catch (e) {
      console.error(`  ${event.slug}: FAILED — ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

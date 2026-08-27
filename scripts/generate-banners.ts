/**
 * Generate promo banners via Protaige Sketch.
 * Usage: pnpm banners:generate                 (active event + next 2, if missing)
 *        pnpm banners:generate --categories     (one banner per product category)
 *        pnpm banners:generate --all            (event + categories)
 *        pnpm banners:generate --force          (regenerate even if one exists)
 *        pnpm banners:generate <event-slug>     (a specific event)
 *        TARGET=production pnpm banners:generate ...
 *
 * Env: SKETCH_API_KEY, SKETCH_BRAND_ID, and the Supabase service creds. For
 * TARGET=production, reads the commented hosted keys from .env.local.
 */
import { readFileSync } from 'node:fs';
import { config } from 'dotenv';
import { generateCreative, bannerPrompt, categoryBannerPrompt, BANNER_CATEGORIES } from '../src/lib/marketplace/sketch';
import { getActiveEvent, listUpcomingEvents, type RetailEvent } from '../src/lib/marketplace/events-service';
import { getBannerForEvent, listActiveBanners, persistBannerImage, saveBanner } from '../src/lib/marketplace/banners-service';

config({ path: '.env.local' });

// Resolve prod creds before any Supabase client runs (they read env lazily).
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
const doCategories = args.includes('--categories') || args.includes('--all');
const doEvents = args.includes('--all') || (!args.includes('--categories'));
const onlySlug = args.find((a) => !a.startsWith('--'));

async function ensureEventBanner(event: RetailEvent): Promise<void> {
  if (!force && (await getBannerForEvent(event.slug).catch(() => null))) {
    console.log(`  event ${event.slug}: exists — skipping`);
    return;
  }
  console.log(`  event ${event.slug}: generating…`);
  const creative = await generateCreative(
    bannerPrompt({ eventName: event.name, category: event.category, discountPct: event.expected_discount_pct })
  );
  const imageUrl = await persistBannerImage(creative.image_url, `event-${event.slug}`);
  await saveBanner({
    event_slug: event.slug,
    headline: event.name,
    image_url: imageUrl,
    href: event.category ? `/search?category=${event.category}` : '/search',
    sort_order: 0, // the live event leads the carousel
  });
  console.log(`  event ${event.slug}: saved`);
}

async function ensureCategoryBanner(category: string, index: number): Promise<void> {
  if (!force) {
    const existing = (await listActiveBanners().catch(() => [])).some((b) => b.category === category);
    if (existing) {
      console.log(`  category ${category}: exists — skipping`);
      return;
    }
  }
  console.log(`  category ${category}: generating…`);
  const { prompt, title } = categoryBannerPrompt(category);
  const creative = await generateCreative(prompt);
  const imageUrl = await persistBannerImage(creative.image_url, `category-${category}`);
  await saveBanner({
    category,
    headline: title,
    image_url: imageUrl,
    href: `/search?category=${category}`,
    sort_order: 10 + index, // after the event banner
  });
  console.log(`  category ${category}: saved`);
}

async function main() {
  const tasks: Array<() => Promise<void>> = [];

  if (doEvents) {
    const events = new Map<string, RetailEvent>();
    const active = await getActiveEvent();
    if (active) events.set(active.slug, active);
    for (const e of await listUpcomingEvents(new Date(), 2)) events.set(e.slug, e);
    const targets = onlySlug ? [...events.values()].filter((e) => e.slug === onlySlug) : [...events.values()];
    for (const e of targets) tasks.push(() => ensureEventBanner(e));
  }
  if (doCategories) {
    BANNER_CATEGORIES.forEach((c, i) => tasks.push(() => ensureCategoryBanner(c, i)));
  }

  if (tasks.length === 0) {
    console.log('Nothing to generate.');
    return;
  }
  console.log(`Generating ${tasks.length} banner(s)…`);
  for (const task of tasks) {
    try {
      await task();
    } catch (e) {
      console.error(`  FAILED — ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

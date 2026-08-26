/**
 * Warm the web-review cache for products currently surfaced on home/search.
 *   npx tsx scripts/warm-reviews.ts            (local stack from .env.local)
 *   TARGET=production npx tsx scripts/warm-reviews.ts
 * Requires GEMINI_API_KEY; production also needs the hosted service key
 * (read from the commented backup lines in .env.local).
 */
import { readFileSync } from 'node:fs';

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
if (process.env.TARGET === 'production') {
  const env = readFileSync('.env.local', 'utf8');
  process.env.NEXT_PUBLIC_SUPABASE_URL =
    env.match(/^# NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim() ?? '';
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    env.match(/^# SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim() ?? '';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
    env.match(/^# NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$/m)?.[1]?.trim() ?? '';
}

import { createClient } from '@supabase/supabase-js';
import { productReviewKey } from '../src/lib/reviews/gemini';
import { getProductReviews } from '../src/lib/reviews/service';

async function main() {
  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const [{ data: listings }, { data: catalog }] = await Promise.all([
    svc.from('products').select('brand, name').eq('is_published', true).limit(40),
    svc
      .from('catalog_products')
      .select('brand, title')
      .eq('is_active', true)
      .order('scraped_at', { ascending: false })
      .limit(60),
  ]);
  const families = new Map<string, { brand: string | null; title: string }>();
  for (const l of listings ?? []) {
    families.set(productReviewKey(l.brand, l.name), { brand: l.brand, title: l.name });
  }
  for (const c of catalog ?? []) {
    families.set(productReviewKey(c.brand, c.title), { brand: c.brand, title: c.title });
  }
  families.delete('unknown');
  console.log(`warming ${families.size} product families (${process.env.TARGET ?? 'local'})…`);
  let done = 0;
  for (const fam of families.values()) {
    const r = await getProductReviews(fam.brand, fam.title).catch(() => null);
    done++;
    console.log(
      `  [${done}/${families.size}] ${fam.title.slice(0, 45)} → ${r?.rating ?? '—'}${r?.quotes.length ? ` (${r.quotes.length} quotes)` : ''}`
    );
  }
}
void main();

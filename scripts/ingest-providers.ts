/**
 * Provider directory ingestion (ADR 0017).
 *   npx tsx scripts/ingest-providers.ts "Dubai" [max]
 *   TARGET=production npx tsx scripts/ingest-providers.ts "Dubai"
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
}

import { ingestProviders } from '../src/lib/ingestion/providers';

async function main() {
  const emirate = process.argv[2] ?? 'Dubai';
  const max = Number(process.argv[3] ?? 60);
  console.log(`→ scraping mobile shops in ${emirate} (${process.env.TARGET ?? 'local'})…`);
  const res = await ingestProviders(emirate, max);
  console.log(`  ${res.emirate}: scraped=${res.scraped} mapped=${res.mapped} upserted=${res.upserted}`);
}
void main().catch((e) => {
  console.error('FAILED:', (e as Error).message.slice(0, 500));
  process.exit(1);
});

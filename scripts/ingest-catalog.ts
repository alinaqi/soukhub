/**
 * Catalog ingestion CLI (ADR 0016).
 *   pnpm catalog:ingest amazon|cartlow|revibe|all
 * Env: APIFY_TOKEN, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * (.env.local is read automatically for local runs).
 */
import { readFileSync, existsSync } from 'node:fs';

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

import { ingestSource } from '../src/lib/ingestion/ingest';

const target = process.argv[2] ?? 'all';
const sources = (target === 'all' ? ['amazon', 'cartlow', 'revibe'] : [target]) as
  Array<'amazon' | 'cartlow' | 'revibe'>;

async function main() {
  for (const source of sources) {
    try {
      console.log(`→ ingesting ${source} …`);
      const res = await ingestSource(source);
      console.log(`  ${source}: scraped=${res.scraped} mapped=${res.mapped} upserted=${res.upserted}`);
    } catch (err) {
      console.error(`  ${source} FAILED: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  }
}

void main();

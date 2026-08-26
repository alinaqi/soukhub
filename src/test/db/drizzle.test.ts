import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { localStackUp } from './helpers';

/**
 * ADR 0015 — Drizzle client smoke test: typed schema maps to the real
 * database built by `drizzle-kit migrate`.
 */

const up = await localStackUp();
const d = describe.skipIf(!up);

type Db = typeof import('@/db');
let mod: Db;

beforeAll(async () => {
  if (!up) return;
  const out = execSync('supabase status -o env', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const dbUrl = out.match(/^DB_URL="([^"]+)"/m)?.[1];
  process.env.DATABASE_URL = dbUrl;
  mod = await import('@/db');
});

afterAll(async () => {
  await globalThis.__soukhubSql?.end({ timeout: 2 });
});

d('drizzle client', () => {
  it('reads organizations through the typed schema', async () => {
    const rows = await mod.db.select().from(mod.dbSchema.organizations).limit(2);
    expect(Array.isArray(rows)).toBe(true);
    if (rows.length > 0) {
      expect(rows[0]).toHaveProperty('id');
      expect(rows[0]).toHaveProperty('slug');
      expect(rows[0]).toHaveProperty('isPublished');
      expect(rows[0]).toHaveProperty('commissionBps');
    }
  });

  it('reads products with marketplace columns present', async () => {
    const rows = await mod.db.select().from(mod.dbSchema.products).limit(1);
    expect(Array.isArray(rows)).toBe(true);
    if (rows.length > 0) {
      expect(rows[0]).toHaveProperty('isPublished');
      expect(rows[0]).toHaveProperty('shortId');
      expect(rows[0]).toHaveProperty('titleAr');
    }
  });
});

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as relations from './relations';

/**
 * Drizzle client (ADR 0015) — SERVER-SIDE ONLY, connects straight to Postgres
 * and therefore BYPASSES RLS. Use it where the service-role Supabase client
 * was used before (trusted server code that scopes queries itself).
 * Browser/RLS-scoped access stays on @supabase/supabase-js.
 */

declare global {
  // Reuse the connection across dev hot reloads / serverless invocations
  var __soukhubSql: ReturnType<typeof postgres> | undefined;
}

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set — required for the Drizzle client (see GETTING_STARTED.md)'
    );
  }
  return url;
}

const sql =
  globalThis.__soukhubSql ??
  postgres(connectionString(), {
    // Supabase's transaction-mode pooler (port 6543) cannot use prepared statements
    prepare: false,
    max: 5,
  });
if (process.env.NODE_ENV !== 'production') globalThis.__soukhubSql = sql;

export const db = drizzle(sql, { schema: { ...schema, ...relations } });
export * as dbSchema from './schema';

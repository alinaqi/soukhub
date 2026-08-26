import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle owns the database schema and migrations (ADR 0015).
 * - Local: DATABASE_URL defaults to the local Supabase stack (GETTING_STARTED.md)
 * - CI deploy: DATABASE_URL comes from the GitHub Actions secret
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: ['./src/db/schema.ts', './src/db/relations.ts'],
  out: './drizzle',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@127.0.0.1:55322/postgres',
  },
  // auth/storage/etc. belong to the Supabase stack, not our migrations
  schemaFilter: ['public'],
  verbose: true,
  strict: true,
});

# Migrations moved

Database schema and migrations are owned by **Drizzle** as of ADR 0015 (2026-08-26).

- Schema source of truth: `src/db/schema.ts` (+ `src/db/relations.ts`)
- Migration SQL: `drizzle/` (baseline `0000_baseline.sql` = the full pre-Drizzle history,
  preserved verbatim in `supabase/migrations-archive/`)
- Apply locally: `pnpm db:migrate` (after `supabase start`)
- Deploy: GitHub Actions (`.github/workflows/db.yml`) on merge to main

`supabase` CLI is still used to run the LOCAL stack (Postgres/Auth/Studio) — it just
no longer applies migrations (this directory is intentionally empty).

# 0015. Drizzle ORM as schema authority; migrations deployed by CI/CD

- **Status**: Accepted
- **Date**: 2026-08-26
- **Supersedes**: [0002](0002-no-orm-supabase-query-builder.md) (partially)

## Context

ADR 0002 chose "no ORM" and named Drizzle as the upgrade path when needs grew. They have: schema now spans 26+ tables across two migration eras, hosted deployment depended on a laptop running `supabase db push` with personal credentials (which blocked production sync entirely), and typed server-side query needs are increasing with the marketplace work.

## Decision

**Drizzle owns the database schema and migrations; GitHub Actions deploys them.**

- Schema source of truth: `src/db/schema.ts` + `src/db/relations.ts` (introspected baseline, evolved by hand).
- Migration SQL lives in `drizzle/`; the entire pre-Drizzle history is preserved verbatim as `0000_baseline.sql` (originals archived in `supabase/migrations-archive/`). Future changes: edit `schema.ts` → `pnpm db:generate` (or `drizzle-kit generate --custom` for RLS/functions/triggers, which stay hand-written SQL) → `pnpm db:migrate`.
- **CI/CD (`.github/workflows/db.yml`)**: every PR touching db files applies the FULL history from zero against a postgres service container (with `scripts/ci/supabase-shim.sql` faking the Supabase roles/auth schema); merges to main run `drizzle-kit migrate` against the hosted database via a `DATABASE_URL` secret in the `production-db` environment. No human runs migrations against production.
- Runtime split: the **Drizzle client (`src/db`) is server-only and bypasses RLS** — it replaces service-role supabase-js usage over time. **supabase-js remains the RLS/auth surface** for browser and cookie-scoped server code. The `supabase` CLI now only runs the local stack; its migrations directory is intentionally empty.

## Alternatives considered

- **Keep supabase CLI push from CI** — needs a Supabase access token with account-wide scope and ties deploys to Supabase's tooling; a plain `DATABASE_URL` secret is narrower and portable.
- **Prisma** — heavier runtime, own migration DSL; Drizzle stays SQL-first, which matters because our RLS/functions are and will remain SQL.
- **Hand-rolled SQL runner in CI** — reinvents drizzle-kit's journal/hashing.

## Consequences

- Fresh databases (CI validation, new environments) build from `0000_baseline.sql` alone — proven by the PR validation job and the local flow (`supabase db reset && pnpm db:migrate`), with the full RLS test suite passing against the result.
- The existing hosted project predates the Drizzle journal AND is missing the M1 migrations — one-time reconciliation is required when credentials are available (recommended: create a fresh Supabase project and let CI apply the baseline; otherwise apply M1 migrations manually once and insert the baseline journal row).
- Two data-access idioms exist during the transition (Drizzle server-side, supabase-js RLS-side) — acceptable because the split is by trust boundary, not by whim; document per ADR here.
- `supabase gen types` remains only for the supabase-js side; Drizzle types come from `schema.ts`.

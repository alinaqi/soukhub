# 0002. No ORM — Supabase query builder with generated types

- **Status**: Accepted
- **Date**: 2025-12-27

## Context

The app needs typed database access from both browser (RLS-protected) and server (service-role) contexts. Options ranged from a full ORM (Prisma, Drizzle) to raw SQL.

## Decision

Use the **`@supabase/supabase-js` query builder directly** — no ORM. Type safety comes from generated types (`src/types/supabase.ts`, regenerated with `supabase gen types typescript --local`) and the helper in `src/lib/supabase/tables.ts`. Schema lives in SQL migrations under `supabase/migrations/`.

## Alternatives considered

- **Prisma** — its own migration system would conflict with Supabase migrations, and it can't run in the browser against RLS; we'd end up with two data-access paths.
- **Drizzle** — closest fit (SQL-first, works with Supabase), but adds a second schema definition to keep in sync; not worth it while the query needs stay simple.

## Consequences

- One data-access idiom everywhere; RLS policies are the single authorization layer.
- Complex queries (joins with aggregation, analytics) either use PostgREST embedded selects, materialized views (see migration 3), or get computed in TypeScript — there is no query composition layer.
- After any schema change you **must** regenerate types, or the compiler lies about the schema.
- Revisit if query complexity grows to the point where hand-written PostgREST selects become unreadable — Drizzle is the natural upgrade path.

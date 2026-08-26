# Current Session State

Updated: 2026-08-26

## Just completed
- **PR #21 merged**: UAE provider directory (ADR 0017) — live on main, migrations 0009/0010 deployed to prod.
- **PR #22 open (feat/claim-store)**: claim-my-store + Google reviews
  - `claim-service.ts` + `POST /api/providers/claim` (session identity, org provisioning, fresh-store prefill, first-write-wins claim, 409 later claimants)
  - Login `?next=` round-trip (allowlist-validated), claim auto-resumes after sign-in
  - Ingestion pulls 5 Google reviews/shop (`maxReviews`), review cards + schema.org Review JSON-LD, "On SoukHub" badges
  - Migration 0011 (`claimed_at`, `google_reviews`), en/ar strings, 144 tests green, E2E screenshots verified locally

## In flight
- Background watcher `b8qx5xugy`: PR #22 checks → merge → prod db-deploy (0011) → TARGET=production providers ingest (Dubai/Sharjah/Abu Dhabi, 40 each, WITH reviews) → prod verify.
- NOTE: prod `/providers` is EMPTY — PR #21's watcher ingest failed 3× ("google_reviews column not found") because local mapper was ahead of prod schema. PR #22's ingest fixes this.

## Next steps
1. When watcher finishes: verify https://soukhub.vercel.app/providers has shops + reviews; screenshot proof.
2. Standing user items: rotate Supabase DB password + update DATABASE_URL secret; submit sitemap in Search Console.
3. Backlog: TODO-066 consumer accounts, TODO-067 re-ingestion cron, M2 cart/Stripe, courier API v2.

## Gotchas (persistent)
- Prune spurious DROP CONSTRAINT lines from every drizzle generate; regen snapshot AFTER schema.ts edits.
- Local test DB accumulates timestamped products → search test flaky; purge `name ~ '\d{13}$'`.
- Always run uncached `npx eslint . --ext .ts,.tsx` before push.

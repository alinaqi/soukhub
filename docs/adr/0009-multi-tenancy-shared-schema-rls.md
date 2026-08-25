# 0009. Multi-tenancy: shared schema + org_id + RLS

- **Status**: Accepted
- **Date**: 2026-08-24

## Context

The marketplace needs many stores on one backend with hard isolation, plus anonymous public read of published storefronts. Current schema is keyed on `user_id` (one user = one business).

## Decision

**Single database, shared schema.** `organizations` (= stores) and `organization_members` (user × org × role: owner/manager/packer/viewer). Every tenant table carries `org_id`; RLS policies check membership via a `SECURITY DEFINER` helper (`is_org_member`). Published stores/listings get anon `SELECT` policies. Buyers are plain platform users with no org. Existing data is backfilled: one org per existing user.

## Alternatives considered

- **Schema-per-tenant** — operational nightmare on Supabase (migrations × N, no cross-tenant queries for marketplace pages).
- **Database-per-tenant** — enterprise isolation we don't need; kills the shared buyer surface.
- **Keep user_id keying + teams table** — roles bolt-on without real isolation semantics; every future feature repays the debt.

## Consequences

- One migration path, cross-tenant marketplace queries (search, home page) stay trivial.
- RLS is the security boundary — every new table MUST ship with org policies and cross-tenant tests (enforced by the TODO-040 test suite pattern).
- `user_id` columns remain during transition (dual-written) until all reads move to `org_id`; drop later.
- Noisy-neighbor risk at large scale — acceptable; revisit only with evidence.

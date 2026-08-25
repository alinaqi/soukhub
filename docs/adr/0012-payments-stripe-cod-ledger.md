# 0012. Payments: Stripe + COD with internal ledger; manual payouts first

- **Status**: Accepted
- **Date**: 2026-08-24

## Context

UAE specifics: COD remains a major share of e-commerce payments; **Stripe operates in the UAE but Stripe Connect marketplace splits are not available there**, so the canonical "Connect + destination charges" marketplace pattern is off the table. GCC-native PSPs (Tap, PayTabs, Checkout.com) offer regional methods (mada, KNET) and some marketplace features.

## Decision

Phase 1: **Stripe (cards + Apple Pay, AED) with the platform as merchant of record**, plus **Cash on Delivery**. All money movement recorded in an immutable **`ledger_entries`** table (sale, commission, refund, cod_collected, payout); seller balances derived from the ledger; payouts run as manual/batch bank transfers by the operator. Card data never touches our servers (PSP-hosted fields). Webhooks signed + idempotent. Phase 2 (ADR when decided): evaluate **Tap Marketplace** / Checkout.com for automated splits, and Tabby/Tamara BNPL.

## Alternatives considered

- **Stripe Connect** — not available for UAE platforms; would force incorporating elsewhere.
- **Tap-first day one** — regional fit but weaker docs/dev-ex; better adopted deliberately in phase 2 with real volume requirements.
- **No COD** — materially suppresses UAE conversion; unacceptable.

## Consequences

- Being merchant of record means we own refunds/disputes and the payout obligation — the ledger is therefore append-only, tested arithmetic, and the source of truth.
- Manual payouts cap operational scale (~dozens of active sellers) — automation is a scheduled phase-2 decision, not a surprise.
- BNPL and regional methods are additive later without re-architecture (PSP behind an interface).

# 0008. Pivot: seller tool → multi-tenant AI-first marketplace

- **Status**: Accepted
- **Date**: 2026-08-24

## Context

SoukHub v1 is a single-seller back-office (orders, inventory, suppliers, WhatsApp, CRM). It has no buyer surface, no tenancy, and no public discovery. The product direction is a UAE electronics marketplace where anyone can open a store and sell — on SoukHub itself and on external marketplaces — with AI woven through every flow (listing creation, search, support, ops).

## Decision

Re-scope SoukHub as a **multi-tenant marketplace platform**: buyer-facing storefronts + checkout on top of the existing seller ops engine, which becomes the seller console. Full evaluation and phased plan: `_project_specs/marketplace-pivot/evaluation.md`; milestones M1–M6 tracked in `_project_specs/todos/`.

## Alternatives considered

- **Stay a SaaS ops tool** — smaller market, no network effects, undifferentiated vs. generic OMS tools.
- **Greenfield rebuild** — discards a working ops engine that is precisely the seller half of a marketplace.

## Consequences

- Every table gains tenancy (ADR 0009); every public page gains SEO/i18n obligations (ADRs 0011, 0013); payments and delivery enter scope (ADRs 0012, 0014).
- The buyer surface has stricter performance and design standards than the console (ADR 0010).
- Pre-pivot roadmap items were archived to the backlog; the marketplace milestones take priority.

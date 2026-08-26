# 0016. External catalog ingestion (Apify) + AI trade-in engine

- **Status**: Accepted
- **Date**: 2026-08-26

## Context

A marketplace with no inventory has no discovery ("empty disco"): nothing on home, empty search, no price signal. Separately, the AI-first promise includes trade-ins: a buyer should be able to photograph their device and get an instant, data-backed value and exchange offers. Both need external market data.

## Decision

**1. Reference catalog, clearly separated from listings.** Apify actors scrape Amazon.ae (junglee/amazon-crawler) and Cartlow/Revibe (apify/cheerio-scraper with tunable page functions in `src/lib/ingestion/sources.ts`) into `catalog_products` (unique per source+source_id, bilingual FTS, public read via RLS, service-role writes). Catalog items are **badged with their source and link out** — they are market reference data, never disguised as SoukHub listings. They back-fill home and search only when live listings are sparse, and seed category discovery. Ingestion: `pnpm catalog:ingest <source>` or `POST /api/admin/ingest` (INGEST_SECRET header). APIFY_TOKEN is server-side only.

**2. AI trade-in engine (with 0014's tiering).** `/trade-in` (public, guest-friendly): photos → Claude vision with a **forced tool schema** (photo/note content cannot inject instructions; owner notes are labeled unverified) → `DeviceAssessment` → valuation from market comparables (catalog + live listings): median of new/renewed prices × condition factor (excellent 0.7 … poor 0.2) × 75% trade-in margin, falling back to same-condition used prices — pure, unit-tested math in `src/lib/tradein/pricing.ts`. Output: AED value + exchange offers against live listings with top-up amounts (negative = buyer receives). Requests persist to `trade_in_requests` (RLS: owner-only reads).

## Alternatives considered

- **Show scraped items as buyable SoukHub listings** — deceptive and legally riskier; badged reference data with outbound links is defensible and still fills discovery.
- **Official marketplace APIs** — don't exist for Cartlow/Revibe; Amazon SP-API is a seller API, not a catalog feed (still the long-term path per ADR 0003).
- **Manual price tables for trade-in** — stale within weeks; comparable-driven pricing tracks the market by construction.
- **Free-form AI valuation ("what's this worth?")** — unauditable; the AI only grades condition, deterministic math prices it.

## Consequences

- Scraper output drifts: mappers are defensive (drop broken rows, dedupe) and selectors are isolated in one config file; the Cartlow/Revibe cheerio actor needs one-time permission approval in the Apify console.
- Scraped content is republished minimally (title, price, image hotlink, outbound link) — revisit image hotlinking if sources object.
- Trade-in offers are estimates ("confirmed on inspection") — an operator workflow for confirming/collecting devices is future work, tracked with consumer accounts.
- Valuation quality scales with catalog density — scheduled re-ingestion matters (weekly cron once the token is a CI secret).

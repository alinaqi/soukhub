# 0017. Provider directory: every UAE mobile shop, Talabat-style

- **Status**: Accepted
- **Date**: 2026-08-26

## Context

Marketplace liquidity is bounded by onboarded sellers. Talabat's insight applies here: list the whole supply side first (every restaurant / every mobile shop), let demand flow through the platform, and convert listed businesses into active partners over time. Google Maps already holds the complete registry of UAE mobile shops — names, phones, locations, ratings, hours.

## Decision

**Scrape the full supply side into a public provider directory and route demand through it.**

- **Ingestion**: Apify's `compass/crawler-google-places` per emirate → `providers` table (unique per Google place id; phone → derived WhatsApp for mobile numbers; emirate inferred; closed shops dropped). `pnpm providers:ingest "<Emirate>" [max]`; re-runs upsert.
- **Directory** (`/providers`, localized en/ar): search, emirate filter, Google ratings, call/WhatsApp/directions actions; **"Shops near me"** uses browser geolocation with client-side haversine sort, backed by a `nearby_providers(lat,lng)` SQL function for server flows. Detail pages carry LocalBusiness (`MobilePhoneStore`) JSON-LD with the Google aggregate rating.
- **Demand routing**: "Get a device from this shop" captures item + buyer contact + delivery address into `provider_requests`, surfaced in the operator Requests inbox next to catalog and trade-in requests, with WhatsApp links to both shop and buyer. V1 fulfilment is operator-brokered (confirm with shop, dispatch a local courier); a courier API integration (Careem/Quiqup/Talabat-style partners) is the planned v2 once volume justifies it (extends ADR 0012/0013 phasing).
- **Conversion path**: `providers.claimed_org_id` reserves the "claim your shop" upgrade — a listed provider becomes a full SoukHub seller org.

## Alternatives considered

- **Manual onboarding only** — years to coverage; the directory gives day-one completeness and every listed shop is a warm lead.
- **Google Places API directly** — per-request pricing and ToS constraints on storing results; scraping via Apify matches the existing catalog pipeline and stores a snapshot we control.
- **Embedding Talabat itself for delivery** — no public 3P API for this use; local courier dispatch is the realistic v1.

## Consequences

- Scraped listings are public business data (names, phones, addresses) — refresh periodically; the unique place-id upsert keeps re-runs cheap; inactive/closed shops get filtered on each pass.
- Shops are listed without consent, Yelp/Google-style — acceptable for public business info; the claim path plus easy removal on request is the policy.
- Operator-brokered fulfilment caps throughput until the courier integration lands; every brokered order builds the case for shops to join properly.

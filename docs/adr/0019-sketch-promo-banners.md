# 0019. Auto-generated promo banners via Protaige Sketch

- **Status**: Accepted
- **Date**: 2026-08-27

## Context

The retail calendar (ADR 0018) highlights the live shopping event, but with a plain text strip. Real marketplaces run designed campaign creatives. Protaige Sketch (sketch.protaige.com) generates on-brand banners from a brand profile over a REST API, which SoukHub already had a reference integration for (the Shopify app).

## Decision

**Generate event banners with Sketch, server-side, and serve stored images.**

- **Brand**: one SoukHub brand grabbed from the live site (`POST /api/v1/brands { url }`), its id in `SKETCH_BRAND_ID`. One account key in `SKETCH_API_KEY` (never committed; `.env.local`).
- **Generation**: `generateCreative(prompt)` → `POST /api/v1/generate { type: 'creative', brandId, prompt }`, returning a 24h-signed image URL. Prompts are built per event (`bannerPrompt`) and are **English-text only** — Sketch's Arabic rendering is unreliable and the site chrome around the image is already localized.
- **Persistence**: the signed URL is short-lived, so `persistBannerImage` downloads it and uploads to a public Supabase Storage bucket (`promo-banners`), returning a permanent public URL. `saveBanner` upserts a `promo_banners` row (one live banner per event+locale).
- **Display**: the home `EventBanner` leads with the stored image when present, else the text strip — no request-path Sketch calls, no hotlinking.
- **Operation**: `pnpm banners:generate [slug] [--force]` runs for the active + next two events; `TARGET=production` targets prod. Intended to run on a schedule as the calendar rolls over.

## Consequences

- Banners are a generated asset we host, not a live dependency: if Sketch is down, generation fails but the site still renders (text fallback), and existing banners keep serving from storage.
- The Sketch key is a paid-account credential — kept in `.env.local`, and the one shared over chat during setup should be rotated.
- Arabic creatives are deferred until text rendering is reliable; a per-locale banner row is already supported by the schema.

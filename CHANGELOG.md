# Changelog

All notable changes to SoukHub are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [SemVer](https://semver.org/) (pre-1.0: minor = feature milestone).

Every PR must add an entry under **[Unreleased]**.

## [Unreleased]

### Added
- **"Deliver to:" location bar (Talabat-style)**: a strip under the home-page nav where buyers set their delivery area — geolocation with OSM reverse geocoding ("Area, City") or a typed address, persisted per device; the saved location prefills the shop-delivery request form and auto-sorts the providers directory by distance
- **Footer shops column**: dedicated directory links (all shops, per-emirate Dubai/Sharjah/Abu Dhabi, claim your shop); `/providers?emirate=…` presets the directory filter
- **Claim my store (ADR 0017 conversion path)**: a listed shop owner claims their directory entry and instantly gets a seller account — `POST /api/providers/claim` provisions the org from the session, prefills a fresh store with the shop's name/logo/area bio, atomically stamps `claimed_org_id` (first write wins, 409 for later claimants), and drops the owner into `/settings/store`; guests round-trip through `/login?next=…` (allowlist-validated) and the claim auto-resumes after sign-in; claimed shops show an "On SoukHub" badge in the directory and on detail pages
- **Google reviews on provider pages**: ingestion pulls up to 5 top reviews per shop (`maxReviews` on the places crawler, defensive mapping with length/star clamps) into `providers.google_reviews`; detail pages render review cards (stars, verbatim text, date) and emit schema.org `Review` objects alongside `AggregateRating` for rich results
- **Provider directory (ADR 0017)**: every UAE mobile shop scraped from Google Maps via Apify into a public `/providers` directory (en+ar) — search, emirate filter, Google ratings, call/WhatsApp/directions, "Shops near me" geolocation sort backed by a `nearby_providers()` haversine function; shop detail pages with `MobilePhoneStore` JSON-LD and a "get a device from this shop" request flow (item + address) that lands in the operator Requests inbox with WhatsApp links to shop and buyer; `pnpm providers:ingest` per emirate; sitemap + nav integration
- **Breadcrumbs + category navigation on product pages**: catalog (`/m/`) and listing (`/p/`) pages show a Home → Category → Item trail (with BreadcrumbList JSON-LD) and a category quick-nav strip with the active category highlighted — localized, RTL-safe
- **Knowledge Center for sellers** (`/knowledge` in the console): ten in-repo guides across Getting Started, Procurement & Sourcing, Orders & Fulfillment, Pricing & Trade-ins, and Growing Your Store — searchable index with category filters, article pages with a dependency-free markdown renderer, related-reading, and deep links into the relevant console sections
- **Seller console: multi-channel orders + operator inbox** — Orders page shows a per-channel breakdown (SoukHub first, then Amazon/Cartlow/Revibe/Noon) with SoukHub channel branding in tables and analytics; new **Requests** inbox (operator-gated via `OPERATOR_EMAILS`) surfaces order-through-SoukHub catalog requests and AI trade-in valuations with WhatsApp deep links and one-click status flow (new → contacted → completed/closed)
- **Google rich-snippet stars**: product and catalog pages emit `AggregateRating` in Product JSON-LD (cached web-review score + count) so ratings can appear as organic stars in search results; catalog pages gain full Product JSON-LD
- **Star ratings on product cards**: home, search and deals cards show cached web-review scores (fractional stars + count) via batched cache reads — no live AI calls on grid paths; `scripts/warm-reviews.ts` pre-fills the cache; family keys collapse storage/color/SKU variants
- **Mobile navigation**: hamburger menu (full site nav, categories, login, language) and a back button on all sub-pages; header decluttered on small screens
- **SEO-friendly catalog URLs**: `/m/{slug}-{shortId}` (≤60-char word-boundary slugs) with 308 redirects from legacy UUID links; search_catalog returns URL fields
- **Social previews + sitemaps**: metadataBase with site-wide OpenGraph/Twitter-card defaults, product-image previews on catalog pages, `sitemap.xml` (static + products + stores + catalog with en/ar alternates) and `robots.txt`
- **Dual-thumb price slider**: single-track range with two thumbs replacing stacked sliders
- **Assistant side drawer**: full-height drawer with backdrop, animated slide-in, product cards with images/prices/conditions from tool results, page-aware suggestion bubbles (home/search/product/trade-in/sell) and page context passed to the model, bold+link markdown rendering, Escape-to-close
- **PWA**: web manifest + icons, installable standalone app, service worker (cache-first static assets, network-first pages, offline fallback page), theme color, apple-touch-icon
- **Search filters v2**: brand autocomplete (from live catalog brands), category dropdown, dual price-range sliders with live AED readout
- **Deals row source diversity**: round-robin across Amazon/Cartlow/Revibe instead of freshest-source-wins
- **Buy online (COD checkout v1)**: guest checkout on every listing — order lands directly in the seller's ops console as a real `soukhub` order (SH- reference), with public status lookup by reference + phone; cards follow with Stripe (ADR 0012)
- **AI shopping assistant**: floating "Ask SoukHub" on every public page — grounded product discovery over live listings + market catalog with internal links, order-status lookup (ref+phone), trade-in guidance; guests welcome
- **Keep-on-SoukHub catalog flow**: market items now open internal pages (`/m/{id}`) with an "Order through SoukHub" request form (WhatsApp follow-up) instead of sending buyers to Amazon/Cartlow/Revibe
- **Retail home**: trade-in promo banner, COD/sell tiles, "Deals under AED 500" from live market data; hero copy removed (sr-only for SEO)

### Fixed
- All product imagery renders via direct <img> (arbitrary marketplace/seller CDNs previously broke next/image); imageless catalog rows deactivated

### Changed
- **Database workflow (ADR 0015, supersedes 0002)**: Drizzle ORM is now the schema authority — `src/db/schema.ts` + migrations in `drizzle/` (full pre-Drizzle history preserved as the baseline). New `Database` CI workflow validates the entire migration history from zero on every PR (postgres service + Supabase shim) and deploys pending migrations to the hosted DB on merge via the `DATABASE_URL` secret — no more laptop `supabase db push`. The supabase CLI now only runs the local stack; server-only Drizzle client added (`src/db`), supabase-js remains the RLS/auth surface

### Added
- **Market catalog ingestion (ADR 0016)**: Apify-powered scrapes of Amazon.ae/Cartlow/Revibe into a badged reference catalog (`catalog_products`, bilingual FTS + `search_catalog()`); fills home and search when live listings are sparse — discovery is never empty (71 real Amazon.ae items ingested in validation). `pnpm catalog:ingest`, `/api/admin/ingest`, defensive mappers with tests
- **AI trade-in engine (ADR 0016)**: public `/trade-in` page (en+ar) — upload photos, Claude vision identifies the device and grades condition (schema-forced, injection-resistant), deterministic valuation from live market comparables, instant AED value + exchange offers with top-ups; requests persisted with owner-only RLS
- **Consumer-first home page**: buyers get search, categories and a live Latest Listings grid up front; the seller pitch moved to a dedicated localized **/sell** page ("For Sellers" in nav/footer) where sellers sign up
- **Seller onboarding → live storefront (TODO-045)**: new "Name your store" onboarding step with auto-suggested, validated store address (reserved routes blocked); store auto-provisioned on first access for new signups; finish screen with storefront link + WhatsApp share; Store Settings page (name/slug/bio/logo in EN+AR, publish toggle, commission display); products console gains Live/Draft chips with one-click publish — publishing the first listing publishes the store; `/api/store` + `/api/products/publish` with role checks (9 new integration tests + 8 slug tests, full E2E verified)
- **Multi-tenant foundation (TODO-040)**: `organizations` become stores (slug, Arabic fields, publishing, commission); membership-based RLS via `is_org_member()`; `org_id` on all tenant tables with backfill and insert-default triggers; public read policies for published stores/listings; 11-test cross-tenant RLS suite
- **Public marketplace storefront (TODO-043)**: buyer-facing home, store pages (`/s/{slug}`), product pages (`/p/{slug}-{shortId}`) — server-rendered with ISR, Product/Offer + Breadcrumb JSON-LD (script-breakout-safe), canonical 308 redirects on renamed slugs, sticky mobile buy bar, WhatsApp order CTA
- **Search v1 (TODO-044)**: `search_listings()` — bilingual FTS (weighted tsvector) + pg_trgm typo tolerance + brand/category/price filters, GIN-indexed, anon-safe via RLS; `/search` page with URL-state filters
- **i18n (TODO-042)**: next-intl with `/` (en) + `/ar` routing, full RTL, IBM Plex Sans Arabic, complete Arabic catalog with parity test, hreflang alternates, localized metadata
- **"Clean Souk" design system (TODO-041)**: commerce-grade palette (white canvas, souk-teal primary, sienna price accent, sand tint), Inter typography, Lucide icons — replaces the AI-SaaS gradient look; guarded by design-token contract tests
- Marketplace pivot scope: detailed evaluation (`_project_specs/marketplace-pivot/evaluation.md`), milestone todos M1–M6, ADRs 0008–0014 (pivot, multi-tenancy, Clean Souk design system, i18n en/ar, payments Stripe+COD+ledger, search/SEO architecture, AI provider tiering)
- Open-source hygiene: MIT LICENSE, this CHANGELOG, CONTRIBUTING.md

### Security
- Adversarial multi-agent review of M1 (40 agents, 17 confirmed findings — all fixed):
  column-level privileges now hide seller cost/margin, owner ids, commission terms and
  settings from anon; `ensure_org_for_user` restricted to service_role; the
  `update_order_status` AI tool is tenant-scoped; JSON-LD no longer fabricates
  item condition and is localized per page; public data-layer errors throw instead of
  caching as 404s; search forms preserve the Arabic locale; localized home metadata +
  hreflang; deep public paths 404 instead of redirecting buyers to /login

### Fixed
- **Security (TODO-047)**: `/api/chat` now derives identity from the session cookie and force-overrides `user_id` in every AI tool call — a client-supplied body `userId` is ignored; unauthenticated API calls return 401 instead of a login redirect

## [0.4.0] — 2026-08-24

### Added
- `GETTING_STARTED.md` — complete clone-to-running guide (local Supabase, env, test user, verification)
- Architecture Decision Records `docs/adr/` 0001–0007 with template and index

### Changed
- AI model upgraded to `claude-sonnet-5` (all call sites)
- CI toolchain fixed: pnpm pinned via `packageManager` (11.20.0), Node 22, setup-node pnpm cache — CI installs had failed since Dec 2025 (pnpm 8 vs lockfile v9)
- `next` 16.1.1 → 16.2.11; dependency audit now reports 0 vulnerabilities (was 86, incl. 2 critical)
- Local Supabase moved to 553xx ports; auth redirect URLs fixed to app port 4000

### Removed
- Unused `whatsapp-web.js`/`puppeteer`/`qrcode` root dependencies and dead `src/lib/whatsapp-service.ts` (the standalone `whatsapp-service/` microservice remains)

### Fixed
- All 22 ESLint errors; stale landing-page tests rewritten
- `/api/chat` no longer requires env vars at build time (lazy Supabase client)

## [0.3.0] — 2025-12-28

### Added
- Supplier Communication Center with WhatsApp integration; standalone WhatsApp microservice (Render)
- Customer CRM: profiles, sync from orders, communication templates (email + WhatsApp)
- Actionable insights dashboard; market trends with product recommendations
- AI chat: markdown, history, product analytics, supplier routing, packing tools
- Universal command bar (Cmd+K); Privacy Policy and Terms pages

## [0.2.0] — 2025-12-27

### Added
- Inventory management with AI-powered CSV header mapping and populate-from-orders
- Analytics dashboard; product catalog; unified orders dashboard
- Claude AI agent with tool definitions and chat interface

## [0.1.0] — 2025-12-27

### Added
- Initial platform: Next.js 16 + TypeScript + Tailwind, Supabase auth + schema, marketplace CSV parsers (Amazon/Cartlow/Revibe), file import flow, landing page, CI workflows

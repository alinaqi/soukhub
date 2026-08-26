# Changelog

All notable changes to SoukHub are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [SemVer](https://semver.org/) (pre-1.0: minor = feature milestone).

Every PR must add an entry under **[Unreleased]**.

## [Unreleased]

### Added
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

# Changelog

All notable changes to SoukHub are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [SemVer](https://semver.org/) (pre-1.0: minor = feature milestone).

Every PR must add an entry under **[Unreleased]**.

## [Unreleased]

### Added
- Marketplace pivot scope: detailed evaluation (`_project_specs/marketplace-pivot/evaluation.md`), milestone todos M1–M6, ADRs 0008–0014 (pivot, multi-tenancy, Clean Souk design system, i18n en/ar, payments Stripe+COD+ledger, search/SEO architecture, AI provider tiering)
- Open-source hygiene: MIT LICENSE, this CHANGELOG, CONTRIBUTING.md

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

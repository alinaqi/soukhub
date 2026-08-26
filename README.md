# SoukHub

**The open-source, AI-first marketplace for the AI era** — open a store in minutes, sell phones & electronics to UAE buyers on SoukHub and across external marketplaces (Amazon, Cartlow, Revibe), with AI in every flow: listing creation from a photo, search that understands intent, ordering via web and WhatsApp, and an AI-powered seller ops engine underneath.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=flat-square&logo=supabase)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

## What is this?

SoukHub is two products sharing one multi-tenant backend:

- **A marketplace** (in progress): public storefronts, fast localized product pages (English + Arabic RTL), guest checkout with cards/Apple Pay/COD, WhatsApp ordering, SEO/GEO-optimized from day one.
- **A seller console** (working today): unified orders across marketplaces, inventory, supplier routing with WhatsApp automation, CRM, analytics, and a Claude-powered ops agent you talk to in natural language.

## Status

| Area | State |
|------|-------|
| Seller console (orders, inventory, suppliers, WhatsApp, CRM, analytics, AI agent) | ✅ Working |
| Multi-tenant backend (stores, membership RLS, public listing policies) | ✅ M1 shipped |
| Public storefronts: home, store & product pages, JSON-LD, en+ar RTL | ✅ M1 shipped |
| Search v1 (bilingual FTS + typo tolerance + filters) | ✅ M1 shipped |
| Seller onboarding rework (store setup → live storefront) | 🚧 M1 — remaining |
| Checkout, payments (Stripe + COD), seller ledger | 📋 M2 — planned |
| AI listing creation, semantic search, AI support (Cerebras) | 📋 M3 — planned |
| SEO scale surface, performance budgets in CI | 📋 M4 — planned |
| Courier integrations, payout automation, BNPL | 📋 M5 — planned |

Roadmap detail: [`_project_specs/todos/`](_project_specs/todos/) · Full pivot evaluation: [`_project_specs/marketplace-pivot/evaluation.md`](_project_specs/marketplace-pivot/evaluation.md)

## Getting Started

Full walkthrough (local Supabase, env setup, test user, AI, WhatsApp): **[GETTING_STARTED.md](GETTING_STARTED.md)**

```bash
git clone https://github.com/alinaqi/soukhub.git && cd soukhub
corepack enable && pnpm install         # pnpm 11, Node 22+
supabase start && supabase db reset     # local Postgres + auth (Docker required)
cp .env.example .env.local              # fill in keys from `supabase status` + Anthropic
pnpm dev                                # http://localhost:4000
```

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, SSR/ISR) · **Language**: TypeScript (strict)
- **Database/Auth**: [Supabase](https://supabase.com/) Postgres with RLS multi-tenancy · [Drizzle ORM](https://orm.drizzle.team/) schema + CI-deployed migrations ([ADR 0015](docs/adr/0015-drizzle-orm-ci-migrations.md))
- **AI**: tiered by task — Claude (ops agent) / Gemini Flash (multimodal listings) / Cerebras (fast buyer-facing) ([ADR 0014](docs/adr/0014-ai-provider-tiering.md))
- **Search**: Postgres FTS + pg_trgm → pgvector hybrid ([ADR 0013](docs/adr/0013-search-and-seo-architecture.md))
- **i18n**: next-intl, English + Arabic RTL first ([ADR 0011](docs/adr/0011-i18n-en-ar-first.md))
- **Payments (planned)**: Stripe + Cash-on-Delivery, immutable ledger ([ADR 0012](docs/adr/0012-payments-stripe-cod-ledger.md))
- **Styling**: Tailwind CSS v4, "Clean Souk" design system ([ADR 0010](docs/adr/0010-clean-souk-design-system.md))
- **Deploy**: Vercel + a standalone WhatsApp microservice on Render ([ADR 0005](docs/adr/0005-whatsapp-standalone-microservice.md))

## Documentation

| Doc | Purpose |
|-----|---------|
| [GETTING_STARTED.md](GETTING_STARTED.md) | Clone → running app in ~10 minutes |
| [docs/adr/](docs/adr/) | Architecture Decision Records — read before proposing structural changes |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design |
| [docs/API.md](docs/API.md) | API routes |
| [CHANGELOG.md](CHANGELOG.md) | Release history (Keep a Changelog) |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How we work: TDD, ADRs, PR rules |

## Contributing

PRs welcome — read [CONTRIBUTING.md](CONTRIBUTING.md) first. In short: TDD is mandatory, every PR updates the CHANGELOG, architectural choices need an ADR, and CI (lint, typecheck, tests, build, secret scan, audit) must be green.

## License

[MIT](LICENSE) © SoukHub contributors

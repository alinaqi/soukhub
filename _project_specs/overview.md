# Project Overview

## Vision

**SoukHub is a multi-tenant, AI-first marketplace for the AI era** — anyone can open a store in minutes and sell phones/electronics to UAE buyers, on SoukHub itself and across external marketplaces (Amazon, Cartlow, Revibe), with AI woven through every flow: listing creation from a photo, semantic search that understands intent, ordering via web and WhatsApp, and an AI-powered ops engine + support system underneath.

Two-sided from day one:
- **Buyers**: fast (LCP < 1.5s), trustworthy, localized (English + Arabic RTL, then Hindi/Urdu/Tagalog) shopping with guest checkout, cards/Apple Pay/COD, and WhatsApp ordering.
- **Sellers**: 5-minutes-to-live storefront, AI listing creation, and the existing back-office (orders, suppliers, WhatsApp automation, CRM, analytics) as their console.

Full evaluation and rationale: `marketplace-pivot/evaluation.md` · Decisions: `docs/adr/` (0008–0014).

## Goals

- [ ] Multi-tenant backend: every store isolated by RLS on one shared schema (M1)
- [ ] Public, SEO/GEO-optimized storefronts and product pages, en+ar, server-rendered (M1)
- [ ] Sub-150ms product search: FTS → hybrid semantic; every product auto-cross-linked (M1→M3)
- [ ] Guest checkout with Stripe + COD; immutable seller ledger and commission (M2)
- [ ] AI listing creation (photo → EN+AR listing), AI support (Cerebras-fast), query-intent understanding (M3)
- [ ] Performance budgets enforced in CI; sitemaps/hub pages/llms.txt at scale (M4)
- [ ] Courier integrations and payout automation (M5); more languages (M6)

## Non-Goals

- Building our own logistics fleet (integrate couriers, don't become one)
- General-merchandise breadth (electronics focus until liquidity)
- Native mobile apps before the PWA-quality web ships
- Replacing external marketplaces — we list into them, not against them (day one)

## Success Metrics

- Seller: signup → first live listing < 5 min; weekly active stores
- Buyer: product-page LCP < 1.5s (p75), search p95 < 150ms, checkout conversion, COD share
- Marketplace: GMV, take-rate revenue, organic (SEO/AI-referral) share of traffic
- AI: % listings AI-created, support auto-resolution rate, search-intent extraction accuracy

# SoukHub Marketplace Pivot — Detailed Evaluation

*Date: 2026-08-24 · Status: Accepted as scope (see ADR 0008)*

## 0. What we have today (honest review of the deployed product)

The app at soukhub.vercel.app is a **single-seller back-office tool**: order import (CSV), inventory, supplier routing via WhatsApp, CRM, analytics, and a Claude tool-use assistant. It works, CI is green, and the domain modeling (orders → items → products → suppliers) is solid.

What it is **not** yet:
- **Not a marketplace** — there is no buyer-facing surface at all. Nobody can browse or buy anything.
- **Not multi-tenant** — every table is keyed on `user_id` (one person = one business). No organizations, no roles in practice, no tenant isolation concept beyond per-user RLS.
- **Not discoverable** — the only public page is a marketing landing page; zero product SEO surface, no sitemap, no structured data, English only.
- **Not fast where it matters** — dashboard pages fetch serially server-side; there is no search index of any kind (product "search" is client-side array filtering).
- **Design**: generic "AI SaaS" aesthetic — blue #2563eb primary, amber accent, gradient hero washes, emoji as icons, `Arial` body font. It reads as a tech demo, not a place to buy a phone. (Direct user feedback: "too AI-ish, needs to be clean and easy for marketplaces.")

**Verdict:** the seller back-office is a real asset — it becomes the *seller half* of the marketplace. The pivot adds the buyer half, tenancy, and discovery, rather than rebuilding.

---

## 1. User-journey evaluation

### Personas
1. **Buyer (primary, new)** — UAE consumer buying phones/electronics. Mobile-first, price-conscious, comparison-shops, often prefers COD, speaks Arabic/English/Hindi/Urdu/Tagalog. Trust is the #1 barrier on an unknown marketplace.
2. **Seller (existing persona, elevated)** — small electronics trader. Wants to list once, sell everywhere (SoukHub + Amazon + Cartlow + Revibe), zero-friction onboarding, WhatsApp-centric.
3. **Platform operator (us)** — moderation, disputes, payouts, growth.

### Buyer journey (target)
```
Discover (Google/AI answer/social/WhatsApp link)
  → Product page (fast, rich, localized, JSON-LD; loads < 1.5s)
  → Trust check (seller rating, condition grade, warranty, return policy — visible above the fold)
  → Buy: guest checkout allowed; pay by card / Apple Pay / COD; or "Order on WhatsApp" deep link
  → Track: order status page + WhatsApp updates
  → Post-purchase: review request, AI support for issues
```
Journey rules: **guest checkout is non-negotiable** (UAE conversion killer otherwise), COD at launch, WhatsApp ordering as first-class path (the region's actual behavior), Arabic parity on every step.

### Seller journey (target)
```
Sign up → "Name your store" (slug, logo, 2 mins)
  → Add first product: photo → AI drafts title/specs/condition/price in EN+AR → publish
  → Storefront live at soukhub.com/{store} immediately
  → Orders arrive → existing ops engine (routing, WhatsApp, packing) takes over
  → Payouts dashboard (ledger of sales – commission)
```
The existing back-office becomes the post-signup seller console mostly unchanged; onboarding must compress to **< 5 minutes to first live listing** (Shopify's bar).

### Gaps this creates (all in the todo list)
Buyer surface (home, category, product, cart, checkout, order tracking, reviews), tenancy (stores, memberships, tenant-scoped RLS), guest checkout, payments, delivery states buyers can see, review/rating system, moderation queue.

---

## 2. Market evaluation

- **Where we play:** UAE C2C/B2C electronics resale & new. Incumbents: Amazon.ae (broad, weak on used/refurb trust), Cartlow/Revibe (refurb, closed supply — *they* buy and sell; we host independent sellers), Dubizzle (classifieds — no checkout/escrow/trust layer), Noon (broad retail).
- **Our wedge:** *the AI-era marketplace for independent electronics sellers* — instant AI listing creation, semantic search that actually understands "iphone 13 under 2000 good battery", ordering over WhatsApp, and a seller back-office better than anything Dubizzle sellers have. Cartlow/Revibe can't host third parties; Dubizzle can't do fulfillment/trust; Amazon won't do WhatsApp-native or used-device nuance well.
- **Monetization:** commission per order (electronics norm 5–8%) + later: featured placement, BNPL margin, logistics margin. Keep listing free (supply first).
- **Cold-start strategy:** sellers already using the ops tool auto-get a storefront → every seller share-link markets the platform; SEO product pages compound; buyers arrive with zero paid CAC.
- **Trust (the real moat):** verified-seller badge (trade license optional), condition grading standard, platform-held reviews, clear return policy per listing, COD as trust bridge.

---

## 3. UI & color-scheme evaluation

### Problem (current)
Blue-gradient "AI SaaS" styling, emoji icons, Arial body — signals *tech demo*. Marketplaces need to signal *retail trust*: clean, dense-but-calm product grids, photography-first, one confident accent, obvious prices and CTAs.

### Direction: "Clean Souk" design system (ADR 0010)
Shopify-grade cleanliness with a subtle Gulf warmth. **No gradients, no emoji-as-icons (Lucide icons only), photography does the talking.**

| Token | Light | Notes |
|-------|-------|-------|
| `--background` | `#ffffff` | pure white commerce canvas |
| `--surface-warm` | `#faf8f5` | sand-tinted section background (the one "souk" touch) |
| `--foreground` | `#1a1a1a` | near-black ink |
| `--muted-foreground` | `#6b7280` | gray-500 |
| `--border` | `#e5e7eb` | gray-200, 1px hairlines |
| `--primary` | `#0f766e` | **souk teal** (teal-700) — trust + distinct from Amazon orange / Noon yellow / Cartlow blue |
| `--primary-hover` | `#115e59` | teal-800 |
| `--accent` | `#c2410c` | burnt sienna — price highlights & deal badges ONLY (scarcity color, used sparingly) |
| `--success/warning/error` | `#16a34a / #d97706 / #dc2626` | standard semantics |
| `--radius` | `0.5rem` | 8px; 12px on cards |

- **Type:** Inter (Latin) + IBM Plex Sans Arabic (Arabic) via `next/font`; prices in tabular figures; drop Arial.
- **Layout language:** 4/8px spacing grid, product cards = image (1:1) / title (2-line clamp) / price bold / condition chip / seller line, sticky mobile buy bar, max-width 1280 content.
- **Dark mode:** keep for the seller console; buyer storefront ships **light-only** initially (commerce conversion norm).
- **RTL:** every component built with CSS logical properties (`ms-`/`me-`, `start/end`) from day one — retrofitting RTL is 10× the cost.

---

## 4. Languages & localization

Day one: **English + Arabic (full RTL)**. Fast follow (UAE demographics): **Hindi, Urdu, Tagalog** — buyer-surface strings only.
- `next-intl` with locale prefix routing `/{en|ar}/...`, `hreflang` alternates, localized metadata.
- Product content: sellers write once; AI translates listing title/description EN↔AR at save time (stored, not on-the-fly — SEO needs static text).
- Numerals: Western Arabic numerals everywhere (UAE convention); AED formatting `AED 1,299` / `د.إ 1,299`.

---

## 5. AI-first architecture (what "AI-era from day one" concretely means)

| Capability | Model/Provider | Why |
|-----------|----------------|-----|
| Seller ops agent (existing) | Claude Sonnet (`claude-sonnet-5`) | complex tool use, already built |
| Listing creation: photo → structured listing (title, specs, condition, EN+AR) | Gemini Flash (latest) | cheap multimodal, structured output |
| Buyer support chat + instant search answers | **Cerebras inference** (fast OSS model, e.g. Llama-class) | sub-second first token = feels native, cheap at volume; escalate hard cases to Claude, then to seller WhatsApp |
| Query understanding (intent → filters) | Cerebras small model, strict JSON schema | "samsung under 1500 with warranty" → `{brand, max_price, warranty:true}` at interactive latency |
| Embeddings (semantic search, cross-linking) | Gemini embedding API (or voyage) → pgvector | stored per listing; related-products = nearest neighbors |
| Supplier reply parsing (existing) | Claude | keep |
| Provider abstraction | `src/lib/ai/providers/` with per-task routing config | swap models without touching features; log cost per call |

**AI support system:** widget on every storefront page → Cerebras-answered from a RAG index of platform policies + seller's own store policies + order context (if authed) → one-tap escalation to human (seller WhatsApp / platform support). All conversations logged for quality; auto-resolve tracking.

---

## 6. SEO + GEO (generative engine optimization)

- Every public page **server-rendered with ISR**; product pages revalidate on update. No client-only content on any indexable page.
- **Structured data:** `Product` + `Offer` + `AggregateRating` JSON-LD on products; `BreadcrumbList`; `Organization`+`WebSite` (site search box) on home; `FAQPage` on help.
- URL design: `/{locale}/p/{slug}-{shortid}` products, `/{locale}/{store}` storefronts, `/c/{category}` categories; canonical + `hreflang` en/ar pairs.
- `sitemap.xml` (segmented: products/stores/categories, auto-regenerated), `robots.txt`, **`llms.txt`** + clean semantic HTML so AI answer engines (the "GEO" in generative-engine terms) can cite us; OG images auto-generated per product.
- Geographic GEO: Emirate-level landing pages (`/dubai/iphones`) once inventory density justifies (auto-generated from listing locations).

## 7. Performance & search (primary constraint, per scope)

- **Budgets (enforced in CI once Lighthouse job lands):** product page LCP < 1.5s on 4G, TTFB < 200ms (ISR/edge cache), search results < 150ms server time, JS < 150KB gz on buyer pages.
- **Search stack, staged:**
  1. *Now:* Postgres FTS (`tsvector` en + ar config) + `pg_trgm` fuzzy + attribute filters — indexed, no external service, covers launch volume.
  2. *Next:* pgvector semantic rerank over FTS candidates (embeddings stored per listing at publish).
  3. *Later:* dedicated engine (Typesense/Meilisearch) only if p95 > 150ms at scale.
- **Auto cross-linking:** related products (embedding NN), "more from this seller", "compare with new", category/brand hub pages — all statically rendered → internal link graph for SEO.
- Images: next/image + Supabase storage with CDN transform; blur placeholders; strict dimensions to kill CLS.

## 8. Payments (UAE reality)

| Option | Verdict |
|--------|---------|
| **Stripe UAE** | ✅ Phase 1 PSP: cards + Apple Pay in AED. **Caveat: Stripe Connect marketplace splits are not available in UAE** — so platform collects, and we run an internal **seller ledger** with scheduled payouts (weekly bank transfer). |
| **Cash on Delivery** | ✅ Phase 1, non-negotiable — large share of UAE e-commerce; ledger records COD as seller-collected (or courier-collected later). |
| **Tap Payments** | Phase 2 evaluation — GCC-native, supports mada/KNET and has marketplace split features; candidate to automate payouts. |
| **Tabby / Tamara (BNPL)** | Phase 2 — meaningful AOV lift in UAE electronics. |
| PayPal / crypto | ❌ Not now. |

Money model: `payment_intents` + immutable `ledger_entries` (order value, commission, refunds, payout batches). Commission configurable per store. Refunds only via ledger reversal. **Never store card data — PSP-hosted fields only.**

## 9. Delivery

- **Phase 1:** seller-fulfilled (existing flow) with buyer-visible statuses + delivery windows; COD reconciliation in ledger. This is how Dubizzle sellers already operate — we standardize it.
- **Phase 2:** courier adapter interface `src/lib/delivery/` (mirror of marketplace adapter pattern): **Aramex** (mature API, nationwide) + **Quiqup** (same-day Dubai) first; aggregator (e.g. OTO) as alternative to N integrations. Label generation, pickup scheduling, webhook tracking → buyer timeline.
- **Phase 3:** platform-negotiated rates as volume leverage; courier-collected COD.

## 10. Multi-tenancy model (ADR 0009)

Single database, shared schema: `organizations` (= stores) + `organization_members` (user × org × role: owner/manager/packer/viewer) + `org_id` column on every tenant table, enforced by RLS (`org_id IN (SELECT ... memberships)`); public read policies for *published* listings/stores. Buyers are plain platform users (no org). Existing single-user data migrates via backfill: one org per existing user. This keeps ops simple on Supabase and is reversible to schema-per-tenant only if an enterprise need appears.

## 11. Open-source hygiene (this repo is public)

MIT license; CHANGELOG.md (Keep-a-Changelog, updated every PR); README kept current with every feature PR; CONTRIBUTING.md (setup → GETTING_STARTED, TDD + ADR process mandatory); ADRs numbered and extended with every architectural decision (0008+ added with this pivot).

## 12. Sequencing (phases map to todos M1–M6)

1. **M1 Foundation** — multi-tenant schema + RLS + backfill; Clean Souk design tokens; i18n scaffold (en/ar RTL); public storefront + product pages (SSR/ISR + JSON-LD); FTS search. *Buyable nothing yet — browsable everything.*
2. **M2 Transact** — cart/guest checkout, COD + Stripe, orders into seller ops engine, buyer tracking page, ledger.
3. **M3 Trust & AI depth** — reviews, verified sellers, AI listing creation (photo→listing EN/AR), semantic search + cross-links, AI support widget (Cerebras).
4. **M4 Scale surface** — category/brand/emirate hub pages, sitemaps, hreflang, llms.txt, OG images, Lighthouse CI budgets.
5. **M5 Payments+ / Delivery+** — payouts automation (Tap eval), BNPL, courier adapters.
6. **M6 More languages** — hi/ur/fil buyer surface.

# Active Todos — Marketplace Pivot, Milestone M1 (Foundation)

Scope source: `_project_specs/marketplace-pivot/evaluation.md` + ADRs 0008–0014.
Pre-pivot todos (Phases 5–11, TODO-019…036) moved to backlog.md §"Pre-pivot backlog" — most shipped; audit before reuse.

Every todo: TDD (failing tests first), CHANGELOG entry, README touch if user-facing, ADR if architectural.

---

## TODO-040: Multi-tenant foundation (organizations + RLS)

**Priority**: P0 · **Blocks everything**

**Description**: Introduce `organizations` (= stores) and `organization_members`, add `org_id` to all tenant tables, rewrite RLS to membership-based, backfill one org per existing user. Public read policies for published stores/listings.

**Schema**:
- `organizations(id, slug UNIQUE, name, name_ar, logo_url, bio, bio_ar, is_published, commission_bps INT DEFAULT 600, created_at)`
- `organization_members(org_id, user_id, role CHECK IN (owner,manager,packer,viewer), UNIQUE(org_id,user_id))`
- `ALTER TABLE products|orders|inventory|suppliers|customers|… ADD org_id UUID REFERENCES organizations`
- Backfill migration: per existing user → org (slug from email local-part), memberships, `org_id` set from `user_id`
- Helper `is_org_member(org_id, min_role)` SECURITY DEFINER; all tenant RLS policies use it
- Anon SELECT on organizations/products WHERE is_published

**Acceptance criteria**:
- [ ] Member of org A cannot read/write org B rows (any table, any role)
- [ ] Anon can read published stores + published listings only
- [ ] Existing user's data fully accessible via their backfilled org
- [ ] All existing app pages still work (org resolved from membership)

**Test cases** (Vitest against local Supabase, two seeded orgs + anon):
- [ ] cross-tenant SELECT/INSERT/UPDATE each blocked per table
- [ ] packer role: can update order status, cannot read ledger/settings
- [ ] anon: published listing visible, draft invisible, tenant tables invisible
- [ ] backfill idempotent (re-run = no dupes)

---

## TODO-041: "Clean Souk" design system

**Priority**: P0 · **Depends**: none (parallel with 040)

**Description**: Replace AI-SaaS palette with commerce-grade tokens per evaluation §3: white canvas, ink `#1a1a1a`, souk-teal primary `#0f766e`, sienna accent `#c2410c` (deals/prices only), sand section tint `#faf8f5`, Inter + IBM Plex Sans Arabic via next/font, Lucide icons (no emoji as UI icons), no gradients. Buyer surface light-only; seller console keeps dark mode.

**Acceptance criteria**:
- [ ] globals.css tokens replaced; all pages render with new palette
- [ ] Landing page redesigned: marketplace-first (buyer + seller CTAs), no gradient washes, no emoji icons
- [ ] Fonts loaded via next/font (no FOUT/Arial)
- [ ] Contrast: all text ≥ WCAG AA against its surface

**Test cases**:
- [ ] page.test.tsx updated for new landing (hero, buyer CTA "Browse phones", seller CTA "Start selling")
- [ ] token contract test: parse globals.css → required tokens exist, no `#2563eb` remnant
- [ ] Visual validation: screenshot review light desktop + mobile (manual gate)

---

## TODO-042: i18n scaffold — English + Arabic with RTL

**Priority**: P0 · **Depends**: 041

**Description**: next-intl with `/{en|ar}` locale routing on public pages; `dir=rtl` for ar; messages files en.json/ar.json; components use logical properties (`ms-/me-/text-start`); localized `<html lang>`, metadata, hreflang alternates.

**Acceptance criteria**:
- [ ] `/en` and `/ar` render landing + storefront routes; ar is RTL end-to-end
- [ ] Locale switcher persists choice (cookie) and swaps URL
- [ ] hreflang pair on every public page; AED formatted per locale
- [ ] No hardcoded user-facing strings on public pages (extraction lint or test)

**Test cases**:
- [ ] request /ar → html[dir=rtl][lang=ar]; /en → ltr
- [ ] missing-key fallback to en (no crash)
- [ ] metadata title localized on landing + product page

---

## TODO-043: Public storefront + product pages (SSR/ISR + JSON-LD)

**Priority**: P0 · **Depends**: 040, 041, 042

**Description**: Buyer-facing routes: marketplace home `/{locale}` (featured stores + latest listings), store page `/{locale}/{storeSlug}`, product page `/{locale}/p/{productSlug}-{shortId}`. ISR (revalidate on publish), Product+Offer JSON-LD, BreadcrumbList, canonical, OG tags, next/image everywhere, sticky mobile buy bar (CTA = "Order on WhatsApp" until M2 checkout).

**Acceptance criteria**:
- [ ] All three routes server-rendered, work logged-out, in both locales
- [ ] Product page: gallery, price (AED), condition chip, seller card, related placeholder, WhatsApp order deep link with prefilled message
- [ ] Valid Product JSON-LD (name, image, price, currency, availability, condition)
- [ ] Draft/unpublished → 404
- [ ] LCP < 1.5s local prod build (manual check now; CI budget in M4)

**Test cases**:
- [ ] store page lists only that org's published products
- [ ] JSON-LD parses and matches listing data
- [ ] unpublished product/store → 404; wrong shortId → 404
- [ ] slug regeneration keeps old URL redirecting (301)

---

## TODO-044: Search v1 — Postgres FTS + filters

**Priority**: P0 · **Depends**: 040, 043

**Description**: `search_listings` SQL function: tsvector (english + arabic configs) over title/brand/description + pg_trgm fuzzy fallback + filters (brand, price range, condition, category, storage) + stable ranking (text rank, recency, seller rating placeholder). `/api/search` + `/{locale}/search` page with URL-state filters. GIN indexes. p95 < 150ms server time at seed volume.

**Acceptance criteria**:
- [ ] "iphon 13" (typo) finds iPhone 13 listings
- [ ] Arabic query finds Arabic-translated listings
- [ ] Filters combine and are URL-shareable (SSR-rendered results)
- [ ] Only published listings ever returned

**Test cases**:
- [ ] exact/typo'd/arabic queries return expected seeded listings in order
- [ ] price+condition filter combination correct
- [ ] draft listing never in results (RLS + function test)
- [ ] EXPLAIN uses GIN indexes (no seq scan on listings)

---

## TODO-045: Seller onboarding → live storefront in <5 min

**Priority**: P1 · **Depends**: 040, 041

**Description**: Rework onboarding: signup → create store (name, slug auto-suggested, logo optional) → add first product (manual form now; AI in M3) → publish → share sheet with storefront link + WhatsApp share. Seller console gains Store settings page (name/slug/logo/bio EN+AR, publish toggle, commission display).

**Acceptance criteria**:
- [ ] New user reaches a live public storefront URL in ≤ 4 screens
- [ ] Slug validation (unique, url-safe, reserved words blocked)
- [ ] Store unpublished by default until first product published
- [ ] Existing users see their backfilled store in settings

**Test cases**:
- [ ] full flow e2e: signup→store→product→publish→anon can view
- [ ] slug collision → suggestion offered
- [ ] reserved slugs (admin, api, p, search, …) rejected

---

## TODO-046: Open-source hygiene pass

**Priority**: P1 · **Depends**: none

**Description**: MIT LICENSE, CHANGELOG.md (Keep a Changelog; backfill releases to date; entry required every PR), CONTRIBUTING.md (GETTING_STARTED link, TDD + ADR + changelog rules), README rewritten for the marketplace scope, PR template gains ADR/changelog checkboxes.

**Acceptance criteria**:
- [ ] LICENSE, CHANGELOG.md, CONTRIBUTING.md exist and are linked from README
- [ ] README describes marketplace vision + current status matrix honestly
- [ ] ADRs 0008–0014 merged (pivot, tenancy, design, i18n, payments, delivery, AI stack/search)

---

## TODO-047: Chat route session-derived identity (security debt)

**Priority**: P1 · **Depends**: 040

**Description**: `/api/chat` must derive user + org from the Supabase session (cookie), not trust body `userId`; tools become org-scoped. Removes the known cross-user data exposure for any logged-in caller.

**Acceptance criteria**:
- [ ] Body `userId` ignored/removed; session user's org used everywhere
- [ ] Unauthenticated → 401 (not redirect) for API
- [ ] All existing chat tools work org-scoped

**Test cases**:
- [ ] authed user A passing B's id in body still gets only A's data
- [ ] no session → 401

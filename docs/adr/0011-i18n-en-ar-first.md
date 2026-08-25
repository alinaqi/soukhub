# 0011. i18n: English + Arabic (RTL) first, next-intl, stored translations

- **Status**: Accepted
- **Date**: 2026-08-24

## Context

UAE marketplace: Arabic parity is table stakes; Hindi/Urdu/Tagalog serve major resident populations. Product content is seller-generated; SEO requires static localized text, not client-side translation.

## Decision

`next-intl` with locale-prefixed routing (`/{en|ar}`), `dir=rtl` for Arabic, message catalogs per locale, `hreflang` alternates on every public page. **Listing content is translated at save time by AI (EN↔AR) and stored** — pages render static localized text. Components use CSS logical properties exclusively. Hindi/Urdu/Tagalog added in M6 for buyer-surface strings only. Western Arabic numerals throughout.

## Alternatives considered

- **On-the-fly translation** — invisible to search engines, latency, cost per view instead of per edit.
- **English-only launch** — concedes the Arabic-first buyer segment and local SEO to incumbents.
- **Domain-per-locale** — splits SEO authority for no gain at this stage.

## Consequences

- Every public component must be RTL-safe from its first commit (10× cheaper than retrofit).
- Translation quality pipeline needed for seller content (AI draft + seller can edit AR text).
- String discipline: no hardcoded user-facing text on public pages (tested).

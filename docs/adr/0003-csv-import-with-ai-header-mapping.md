# 0003. Marketplace data via CSV import with AI header mapping

- **Status**: Accepted
- **Date**: 2025-12-27

## Context

Sellers operate on Amazon UAE, Cartlow, and Revibe. Only Amazon offers a real seller API (SP-API, with an onerous approval process); Cartlow and Revibe offer none. Sellers can, however, export orders as CSV/TSV from every marketplace's seller portal.

## Decision

Import marketplace data through **file upload of CSV/TSV exports**, with per-marketplace parsers in `src/lib/parsers/` and an **AI fallback** (`/api/map-headers`) that uses Claude to map unknown column headers onto our schema when a file doesn't match a known format.

## Alternatives considered

- **Direct API integrations** — impossible for Cartlow/Revibe; deferred for Amazon until SP-API access is justified.
- **Browser-extension scraping of seller portals** — fragile, ToS-risky, high maintenance.

## Consequences

- Works with every marketplace from day one and degrades gracefully to new/unknown export formats via AI mapping.
- Data is only as fresh as the last upload — no real-time order sync. The daily-operations features assume sellers import at least once per day.
- Adding a marketplace = adding a parser + fixture tests, not an API client.
- Revisit when order volume justifies Amazon SP-API onboarding; the adapter pattern in `src/lib/marketplaces/` is reserved for that.

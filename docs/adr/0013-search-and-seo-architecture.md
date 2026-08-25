# 0013. Search & discovery: staged Postgres-native search; SEO/GEO by construction

- **Status**: Accepted
- **Date**: 2026-08-24

## Context

Search speed and discoverability are declared primary constraints. Volume at launch is thousands of listings, not millions. Every product must be semantically searchable, cross-linkable, and indexable by both search engines and AI answer engines.

## Decision

**Stage the search stack inside Postgres**: (1) FTS `tsvector` (english + arabic) + `pg_trgm` fuzzy + attribute filters with GIN indexes, exposed as one SQL function with a 150ms p95 budget; (2) add pgvector semantic rerank using stored per-listing embeddings computed at publish; (3) a dedicated engine (Typesense/Meilisearch) only on measured p95 breach. **Query intent** (free text → structured filters) runs on a fast small model (Cerebras) with strict JSON output and FTS fallback. **SEO/GEO by construction**: every public page SSR/ISR, Product/Offer/AggregateRating JSON-LD, canonical + hreflang, segmented sitemaps, llms.txt, auto-generated hub pages (category/brand/emirate) forming the internal link graph, per-product OG images. Performance budgets (LCP < 1.5s product page, JS < 150KB gz buyer routes) enforced in CI from M4.

## Alternatives considered

- **Algolia/Typesense day one** — an extra service, sync pipeline, and cost before scale demands it.
- **Embeddings-only search** — poor for exact model/SKU queries; hybrid beats either alone.
- **Client-rendered listing pages** — invisible to crawlers/answer engines; violates the SEO constraint outright.

## Consequences

- Search quality work is SQL + prompt work initially — cheap to iterate, easy to test.
- Embedding provider (Gemini embeddings initially) is abstracted behind `src/lib/ai/providers/`; switching is contained.
- The migration trigger to a dedicated engine is a **measured number** (p95 > 150ms), not a feeling.

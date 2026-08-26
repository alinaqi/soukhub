# Current Session State

Updated: 2026-08-27

## Just completed (branch feat/deals-providers-spec, PR pending)
- PR #22 (claim + Google reviews) and PR #23 (Deliver-to bar + footer shops) merged & verified live on prod
- Seller deals: migration 0012 (RLS, partial unique live-deal index), deals-service, /api/deals, console /deals page, home SellerDealsStrip, product-page deal price + strikethrough
- Providers as sellers on home: HomeShopsStrip (distance-sorted by Deliver-to location)
- Laptop/computer shops: ingestion terms extended, directory kind chips (All/Mobile/Computers)
- Six UAE languages: en/ar/hi/ur/ml/tl full catalogs (workflow-translated + verified), routing/middleware, Urdu RTL, LocaleSwitcher menu
- AI agent spec alignment (ADR 0018): 3-product cap, 'Get this one' answer shape, question policy, language mirroring, no-match honesty; hero 'What do you need?' + Ask AI event bridge; catalog 'Price verified {n}h ago' (+ scraped_at GRANT)
- docs/spec-gap-report.md (4-agent audit), backlog TODO-068..072
- 161 tests green, lint clean, E2E screenshots verified (home strips, Ask AI, kind chips, hi/ur locales, deal pricing)

## In flight
- Adversarial review workflow wf_61ed4f45-ac1 on the staged diff → fix confirmed findings → PR #24 → watcher (merge → db-deploy 0012 → prod re-ingest providers incl. computer shops → prod verify)

## Notes
- Local demo deal seeded on demo-seller (Samsung S24 Ultra 2799/3499)
- Prod ingest after merge should re-run all emirates so computer/laptop shops appear

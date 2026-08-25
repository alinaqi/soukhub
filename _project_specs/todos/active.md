# Active Todos — Marketplace Pivot

**Milestone M1 (Foundation) is COMPLETE** — TODO-040…047 shipped and merged (see completed.md).

Next: promote **M2 — Transact** (TODO-048…052) from backlog.md when starting checkout/payments work:
cart + guest checkout, Stripe + COD, marketplace orders → seller ops engine, seller ledger + commission, buyer tracking.

Known follow-ups carried into M2:
- [ ] Column-privilege hardening for *authenticated* buyers (anon is locked down; logged-in users can still read full published rows — move cost data to a member-only table) — fold into TODO-051 ledger work
- [ ] CI database service so the DB integration tests run in CI (they auto-skip today) — fold into TODO-061
- [ ] Migrate `middleware` file convention → `proxy` (Next deprecation)
- [ ] Console restyle to Clean Souk + replace remaining emoji icons in console sidebar
- [ ] Hosted Supabase `db push` of migrations 4-6 (blocked on project credentials)

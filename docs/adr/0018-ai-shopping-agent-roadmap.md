# 0018. AI shopping agent: spec adoption roadmap

- **Status**: Accepted
- **Date**: 2026-08-27

## Context

The product spec (SoukHub — AI Shopping Agent Specification v0.1) reframes SoukHub around one idea: the user says what they need, the agent finds the **best** deal — cost, condition, timing, seller trust, and use case combined — and gives one simple answer. A four-agent audit mapped the spec against the codebase; the full result lives in `docs/spec-gap-report.md`.

## Decision

Adopt the spec incrementally in three rings, keeping the marketplace (browse/search/deals) alongside the agent rather than replacing it.

**Ring 1 — shipped with this ADR (quick wins)**
- Answer shape: the assistant leads with ONE top pick ("Get this one" + one plain-language sentence), at most two alternatives with plain trade-off labels, hard cap of 3 products per answer (enforced in code, not just prompt).
- Question policy in the system prompt: ≤3 questions/session, never ask what the request implies, 2–4 tappable options.
- Language: detect-and-mirror any of AR/EN/HI/UR/ML/TL; the whole UI now ships in all six (next-intl catalogs, Urdu RTL).
- Honesty: grounded-tools-only remains enforced; "no good match → say so" added to the prompt.
- Freshness: catalog pages show "Price verified {n}h ago" from `scraped_at` (spec §7.6, display half).
- Entry: home hero asks "What do you need?" and can hand the question to the agent (Ask AI).

**Ring 2 — next (needs new tables/config, no new infra)**
- Spec floors (`spec_floors` table + `get_spec_floor` tool) for laptops' three launch use cases.
- UAE retail calendar (`events` table + `get_event_calendar`) with the known events. **(shipped: seeded calendar + active-event home banner + category deals; the `get_event_calendar` agent tool is the remaining half.)**
- Price history recording: daily min price per catalog family (`price_points`), started NOW so the 90-day gate is reachable — the long-term asset the spec says to never delete.
- Offer expiry: mark catalog rows not seen in two ingestion runs as expired (freshness enforcement half).
- Deterministic `score_offers` with per-use-case weights in config.

**Ring 3 — later (new subsystems)**
- Canonical product graph (GTIN → rules → LLM classifier with review queue).
- Timing model ("wait until {date}, drops ~AED X") + alerts via WhatsApp.
- WhatsApp as a first-class agent channel; voice input.
- Scenario evaluation suite with the seven graders and the 100% honesty gate.
- Affiliate feed lanes (Sharaf DG, noon, Amazon Creators API) with ToS review.

## Consequences

- The agent gets simpler and more honest before it gets smarter: the 3-product cap and no-match honesty are in code today; scoring and timing land only with real data behind them (no fake "wait" advice without 90 days of history — spec §5.3 forbids it).
- Recording price history is the schedule-critical item: every ring-3 feature depends on it, so ring 2 starts with it.
- The marketplace surfaces (deals, providers, categories) stay: the spec's "one text box" applies to the agent entry, not to the whole product, which also serves browse-first shoppers and SEO.

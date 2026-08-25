# 0010. "Clean Souk" design system for the buyer surface

- **Status**: Accepted
- **Date**: 2026-08-24

## Context

The current palette (blue #2563eb + amber, gradient washes, emoji icons, Arial) reads as an AI tech demo. Direct feedback: "too AI-ish — needs to be clean and easy for marketplaces." Commerce UIs convert on retail trust: white canvas, photography-first, one confident accent, unambiguous prices/CTAs.

## Decision

Adopt the **Clean Souk** token set: white background, ink `#1a1a1a`, souk-teal primary `#0f766e` (hover `#115e59`), burnt-sienna accent `#c2410c` reserved for prices/deals, sand section tint `#faf8f5`, gray-200 hairline borders, 8px radius. Inter + IBM Plex Sans Arabic via `next/font`. **Lucide icons only — no emoji as UI icons. No gradients.** Buyer surface ships light-only; seller console keeps dark mode. All components use CSS logical properties for RTL.

## Alternatives considered

- **Amazon-orange / Noon-yellow adjacency** — reads as imitation and collides with competitors' brand recall.
- **Keep blue** — the most generic SaaS color; zero brand distinctiveness in this market.
- **Full dark-mode buyer surface** — conversion risk; not what UAE commerce users expect.

## Consequences

- One-time restyle cost across existing console pages (acceptable — tokens, not per-page rewrites).
- Accent discipline (sienna = commercial urgency only) needs review vigilance.
- Distinct ownable identity; the sand tint is the only "regional" flourish — everything else is neutral retail.

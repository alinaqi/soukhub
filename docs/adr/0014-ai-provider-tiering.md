# 0014. AI provider tiering: Cerebras / Gemini / Claude by task profile

- **Status**: Accepted
- **Date**: 2026-08-24

## Context

"AI-first" spans wildly different latency/cost/capability profiles: buyer-facing chat must feel instant and costs scale with traffic; listing creation is multimodal; seller ops agent needs deep tool use. One model for everything fails at least two of the three.

## Decision

Route by task through a provider abstraction (`src/lib/ai/providers/` with per-task config + cost logging):

| Task | Provider | Profile |
|------|----------|---------|
| Buyer support chat, instant answers | **Cerebras inference** (fast OSS-class model) | sub-second first token, cheap at volume |
| Query intent → filters | Cerebras small model, strict JSON | <300ms interactive budget |
| Photo → structured listing (EN+AR), translations | **Gemini Flash** (latest) | cheap multimodal, structured output |
| Embeddings | Gemini embeddings → pgvector | stored at publish |
| Seller ops agent, supplier reply parsing, escalated support | **Claude Sonnet** (`claude-sonnet-5`) | complex tool use (existing) |

All user-facing generation is schema-constrained where feasible; support answers must ground in retrieved policy/context chunks (no free-floating claims). Per-call cost and latency logged.

## Alternatives considered

- **Claude everywhere** — right capability, wrong cost/latency for storefront-scale chat.
- **Self-hosted OSS** — ops burden with no advantage over Cerebras-hosted speed at our scale.
- **Single vendor (Gemini everything)** — loses the Cerebras latency edge for chat and Claude's tool-use strength for ops.

## Consequences

- Three vendor dependencies — mitigated by the provider interface (each task swappable independently) and logged per-task cost visibility.
- Model names/versions live in one config file, not scattered call sites (fixes the historical grep-and-bump pattern).
- Escalation ladders (Cerebras → Claude → human) must be tested paths, not fallthroughs.

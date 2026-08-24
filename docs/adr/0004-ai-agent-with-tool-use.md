# 0004. AI assistant as a Claude tool-use agent

- **Status**: Accepted
- **Date**: 2025-12-27

## Context

The core product promise is managing the business in natural language ("route today's orders to suppliers", "which product sells best?"). The AI needs to *act* on real data, not just chat.

## Decision

Implement the assistant as a **single Claude tool-use agent** in `src/app/api/chat/route.ts`: one system prompt, a flat list of typed tools (order stats, inventory CRUD, routing, analytics, packing…), and a server-side loop that executes tool calls against Supabase until the model stops requesting them. Supplier WhatsApp replies are parsed by a separate structured-output call (`src/lib/ai/parse-supplier-reply.ts`).

## Alternatives considered

- **Framework (LangChain / agent SDKs)** — abstraction overhead and lock-in for what is a ~50-line loop over the raw Anthropic SDK.
- **Multi-agent orchestration** — unjustified complexity at this scale; a flat toolset keeps behavior debuggable.
- **RAG over app data** — wrong shape: the data is structured and queryable, so tools > embeddings.

## Consequences

- Adding a capability = adding one tool definition + one handler function; the model composes them.
- The tool loop runs within a single serverless invocation — very long chains risk function timeouts.
- The route currently trusts a client-supplied `userId` (middleware ensures *a* user is logged in, but not *which*); tools scope queries by that ID. **Known gap:** derive the ID from the session server-side instead.
- Model pinned per call site (`claude-sonnet-5`); tool results are also used to render UI action chips, so tool output shapes are part of the frontend contract.

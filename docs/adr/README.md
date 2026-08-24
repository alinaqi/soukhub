# Architecture Decision Records (ADRs)

This directory records the significant architectural decisions made in SoukHub — what was decided, why, and what we gave up. Read these before proposing structural changes; add a new one whenever you make a decision that future contributors would otherwise have to reverse-engineer.

## Index

| # | Title | Status |
|---|-------|--------|
| [0001](0001-nextjs-supabase-claude-stack.md) | Next.js + Supabase + Claude stack | Accepted |
| [0002](0002-no-orm-supabase-query-builder.md) | No ORM — Supabase query builder with generated types | Accepted |
| [0003](0003-csv-import-with-ai-header-mapping.md) | Marketplace data via CSV import with AI header mapping | Accepted |
| [0004](0004-ai-agent-with-tool-use.md) | AI assistant as a Claude tool-use agent | Accepted |
| [0005](0005-whatsapp-standalone-microservice.md) | WhatsApp integration as a standalone microservice | Accepted |
| [0006](0006-pnpm11-node22-toolchain.md) | pnpm 11 + Node 22 toolchain, pinned via packageManager | Accepted |
| [0007](0007-local-supabase-nonstandard-ports.md) | Local Supabase on non-default 553xx ports | Accepted |

## How to add an ADR

1. Copy `template.md` to `NNNN-short-kebab-title.md` (next number in sequence).
2. Fill in every section — **Context** and **Consequences** matter most; a decision without trade-offs listed is a decision half-recorded.
3. Set status: `Proposed` while under discussion, `Accepted` once merged, `Superseded by NNNN` if replaced later. Never delete an ADR — supersede it.
4. Add a row to the index above.
5. Submit it in the same PR as the change it justifies (or on its own for retroactive records).

Keep ADRs short (half a page is ideal). They explain *why*, not *how* — implementation details live in code and `docs/ARCHITECTURE.md`.

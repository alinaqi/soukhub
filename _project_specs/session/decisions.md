<!--
LOG DECISIONS WHEN:
- Choosing between architectural approaches
- Selecting libraries or tools
- Making security-related choices
- Deviating from standard patterns

This is append-only. Never delete entries.
-->

# Decision Log

Track key architectural and implementation decisions.

## Format
```
## [YYYY-MM-DD] Decision Title

**Decision**: What was decided
**Context**: Why this decision was needed
**Options Considered**: What alternatives existed
**Choice**: Which option was chosen
**Reasoning**: Why this choice was made
**Trade-offs**: What we gave up
**References**: Related code/docs
```

---

## [2025-12-27] Initial Tech Stack Selection

**Decision**: Use Next.js with Supabase and Claude AI
**Context**: Starting new AI agent project for marketplace sellers
**Options Considered**:
1. Next.js + Supabase + Claude
2. Python FastAPI + PostgreSQL + Claude
3. Node.js Express + MongoDB + OpenAI
**Choice**: Option 1 - Next.js + Supabase + Claude
**Reasoning**:
- Next.js provides excellent full-stack capabilities with App Router
- Supabase offers auth, database, and realtime out of the box
- Claude excels at complex reasoning tasks needed for marketplace operations
- TypeScript for type safety across the stack
**Trade-offs**: Less flexibility than pure Python for ML/data tasks, but better for web app development
**References**: CLAUDE.md, _project_specs/overview.md

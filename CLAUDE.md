# CLAUDE.md

## Skills
Read and follow these skills before writing any code:
- .claude/skills/base.md
- .claude/skills/security.md
- .claude/skills/project-tooling.md
- .claude/skills/session-management.md
- .claude/skills/typescript.md
- .claude/skills/react-web.md
- .claude/skills/nodejs-backend.md
- .claude/skills/llm-patterns.md
- .claude/skills/supabase-nextjs.md

## Project Overview
SoukHub — AI agent for multi-channel marketplace sellers. Helps sellers manage listings, inventory, orders, and analytics across multiple e-commerce marketplaces from a single intelligent interface.

## Tech Stack
- **Language**: TypeScript
- **Framework**: Next.js (App Router)
- **Frontend**: React with Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **AI/LLM**: Anthropic Claude (AI-first application)
- **Deployment**: Vercel
- **Testing**: Vitest + React Testing Library

## Key Commands
```bash
# Verify all CLI tools are working
./scripts/verify-tooling.sh

# Install dependencies
pnpm install          # or: npm install

# Run development server
pnpm dev              # or: npm run dev

# Run tests
pnpm test             # or: npm test

# Lint
pnpm lint             # or: npm run lint

# Type check
pnpm typecheck        # or: npm run typecheck

# Database
pnpm db:start         # Start local Supabase
pnpm db:migrate       # Push migrations
pnpm db:gen-types     # Generate TypeScript types

# Deploy
vercel                # Deploy to preview
vercel --prod         # Deploy to production
```

## Documentation
- `docs/` - Technical documentation
- `_project_specs/` - Project specifications and todos

## Atomic Todos
All work is tracked in `_project_specs/todos/`:
- `active.md` - Current work
- `backlog.md` - Future work
- `completed.md` - Done (for reference)

Every todo must have validation criteria and test cases. See base.md skill for format.

## Session Management

### State Tracking
Maintain session state in `_project_specs/session/`:
- `current-state.md` - Live session state (update every 15-20 tool calls)
- `decisions.md` - Key architectural/implementation decisions (append-only)
- `code-landmarks.md` - Important code locations for quick reference
- `archive/` - Past session summaries

### Automatic Updates
Update `current-state.md`:
- After completing any todo item
- Every 15-20 tool calls during active work
- Before any significant context shift
- When encountering blockers

### Decision Logging
Log to `decisions.md` when:
- Choosing between architectural approaches
- Selecting libraries or tools
- Making security-related choices
- Deviating from standard patterns

### Context Compression
When context feels heavy (~50+ tool calls):
1. Summarize completed work in current-state.md
2. Archive verbose exploration notes to archive/
3. Keep only essential context for next steps

### Session Handoff
When ending a session or approaching context limits, update current-state.md with:
- What was completed this session
- Current state of work
- Immediate next steps (numbered, specific)
- Open questions or blockers
- Files to review first when resuming

### Resuming Work
When starting a new session:
1. Read `_project_specs/session/current-state.md`
2. Check `_project_specs/todos/active.md`
3. Review recent entries in `decisions.md` if context needed
4. Continue from "Next Steps" in current-state.md

## Project-Specific Patterns

### Marketplace Integrations
- Each marketplace (Amazon, eBay, etc.) should have its own adapter in `src/lib/marketplaces/`
- Use a common interface for all marketplace operations
- Store marketplace credentials securely in Supabase with encryption

### AI Agent Architecture
- Agent logic lives in `src/lib/agent/`
- Use structured tool definitions for marketplace operations
- Maintain conversation context in database for continuity
- Log all agent actions for debugging and improvement

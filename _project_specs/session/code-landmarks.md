<!--
UPDATE WHEN:
- Adding new entry points or key files
- Introducing new patterns
- Discovering non-obvious behavior

Helps quickly navigate the codebase when resuming work.
-->

# Code Landmarks

Quick reference to important parts of the codebase.

## Entry Points
| Location | Purpose |
|----------|---------|
| src/app/page.tsx | Main application entry |
| src/app/api/ | API routes |

## Core Business Logic
| Location | Purpose |
|----------|---------|
| src/lib/agent/ | AI agent logic |
| src/lib/marketplaces/ | Marketplace adapters |

## Configuration
| Location | Purpose |
|----------|---------|
| .env.local | Environment variables |
| next.config.js | Next.js configuration |
| supabase/ | Supabase configuration |

## Key Patterns
| Pattern | Example Location | Notes |
|---------|------------------|-------|
| Marketplace Adapter | src/lib/marketplaces/base.ts | Common interface for all marketplaces |
| Agent Tools | src/lib/agent/tools/ | Tool definitions for AI agent |

## Testing
| Location | Purpose |
|----------|---------|
| src/__tests__/ | Test files |
| vitest.config.ts | Test configuration |

## Gotchas & Non-Obvious Behavior
| Location | Issue | Notes |
|----------|-------|-------|
| - | - | - |

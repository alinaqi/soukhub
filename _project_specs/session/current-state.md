<!--
CHECKPOINT RULES (from session-management.md):
- Quick update: After any todo completion
- Full checkpoint: After ~20 tool calls or decisions
- Archive: End of session or major feature complete
-->

# Current Session State

*Last updated: 2026-08-24*

## Active Task
Marketplace pivot M1 (feat/m1-foundation): TODO-040/041/042/043/044/047 implemented with TDD; TODO-045 (onboarding rework) + TODO-046 partially (docs merged) remain.

## Current Status
- **Phase**: implementing / validating (M1)
- **Progress**: 45 tests green (11 RLS + 8 search + design/i18n/lib/landing), lint 0, tsc clean, build passes; visual validation done via headless Chrome (desktop+mobile, en+ar RTL)
- **Blocking Issues**: Claude-in-Chrome extension cannot reach localhost (needs site permission) — used headless Chrome instead.

## Completed This Session
- [x] Reviewed full project state (Phases 1-4 done; Phases 5-8 features shipped on this branch: workflow config, suppliers, order routing, WhatsApp microservice, CRM, insights, AI chat upgrades)
- [x] Fixed all 22 lint errors (unescaped entities, explicit any, prefer-const, react-hooks purity/set-state rules)
- [x] Rewrote stale src/app/page.test.tsx for current landing page (4/4 passing)
- [x] Security: removed unused whatsapp-web.js/puppeteer/qrcode from root deps, deleted dead src/lib/whatsapp-service.ts, bumped next 16.1.1→16.2.11, added pnpm audit overrides → `pnpm audit` now clean (was 86 vulns, 2 critical)
- [x] Fixed root cause of CI failures since Dec: CI pinned pnpm 8 which can't read the v9 lockfile. Pinned packageManager pnpm@11.20.0, action-setup@v4, setup-node pnpm cache
- [x] Updated AI model claude-sonnet-4-20250514 → claude-sonnet-5 (4 call sites)
- [x] Local Supabase running (ports moved to 553xx to avoid zenloop-db conflict); all 3 migrations applied; schema verified in sync with hosted project
- [x] .env.local switched to local stack (hosted values kept commented as backup); test user test@soukhub.local created; dev server verified on :4000

## Key Context to Preserve
- DB: Supabase Postgres. NO ORM — @supabase/supabase-js query builder + generated types (src/types/supabase.ts, src/lib/supabase/tables.ts)
- Local stack: API http://127.0.0.1:55321, DB postgresql://postgres:postgres@127.0.0.1:55322/postgres, Studio :55323 (non-standard ports because another supabase project uses 543xx)
- Local test login: test@soukhub.local / soukhub-test-123
- Hosted project ref apagqawvajwmcnceejbf — keys verified working (anon + service_role)
- WhatsApp runs as separate microservice (whatsapp-service/, deployed on Render); main app calls it via src/lib/whatsapp-client.ts
- Latent bug (deferred): src/app/(dashboard)/import/page.tsx `updated` counter is never incremented — import result always reports 0 updated

## Next Steps
1. [x] PR #3 merged to main (admin merge; repo requires 1 review and no second reviewer exists)
2. [ ] After merge: verify Vercel production deploy (note: production still points at hosted Supabase)
3. [ ] Consider fixing the `updated` counter bug in import page
4. [ ] Note: Next.js warns `middleware` file convention is deprecated in favor of `proxy` — migrate when convenient

## Resume Instructions
1. `supabase start` (if not running), `pnpm dev` → http://localhost:4000
2. Log in with test@soukhub.local / soukhub-test-123
3. Check PR #3 status: `gh pr checks 3`

# Contributing to SoukHub

Thanks for helping build the AI-era marketplace. This guide is short — the linked documents carry the detail.

## Setup

Follow **[GETTING_STARTED.md](GETTING_STARTED.md)** — clone to running app (local Supabase, env, test user) in ~10 minutes.

## How we work

1. **Read the ADRs first** — [`docs/adr/`](docs/adr/) records why the architecture is the way it is. Don't relitigate an accepted ADR in a PR; open a superseding ADR instead.
2. **TDD is mandatory** — write failing tests, watch them fail, implement, watch them pass. PRs with untested code paths get bounced.
3. **Scope lives in `_project_specs/todos/`** — pick from `active.md` (current milestone) or propose additions to `backlog.md`. Every todo has acceptance criteria and test cases; your PR should check them off.
4. **Branch → PR → green CI → merge.** No direct pushes to `main`. CI runs lint, typecheck, tests, build, secret scan, and dependency audit — all must pass.

## Every PR must

- [ ] Include tests that failed before the change
- [ ] Add a **CHANGELOG.md** entry under `[Unreleased]`
- [ ] Update **README.md** / **GETTING_STARTED.md** if behavior or setup changed
- [ ] Add or update an **ADR** if it makes an architectural choice
- [ ] Pass `pnpm lint && pnpm typecheck && pnpm test --run && pnpm build`
- [ ] Keep `pnpm audit --audit-level=high` at zero findings

## Conventions

- TypeScript strict; no `any` (use `unknown` + narrowing)
- Public (buyer-facing) components: CSS logical properties only (RTL support), no hardcoded user-facing strings (i18n catalogs), server-rendered
- Database: changes only via new files in `supabase/migrations/`; every tenant table ships with RLS policies **and cross-tenant tests**; regenerate types after schema changes
- Security: no secrets in code or `NEXT_PUBLIC_*`; parameterized queries only; validate inputs at API boundaries

## Reporting issues

Use GitHub Issues. For security vulnerabilities, please do not open a public issue — email the maintainer instead.

## License

By contributing you agree your contributions are licensed under the [MIT License](LICENSE).

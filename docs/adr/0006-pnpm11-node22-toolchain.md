# 0006. pnpm 11 + Node 22 toolchain, pinned via packageManager

- **Status**: Accepted
- **Date**: 2026-08-24

## Context

CI was silently broken for months: workflows pinned pnpm 8, which cannot read the lockfileVersion 9 file written by pnpm 11 on dev machines. Every CI run failed at `pnpm install` in ~14 seconds, so lint/test/build results were never actually produced, while local dev appeared fine.

## Decision

**Pin the package manager in one place**: `"packageManager": "pnpm@11.20.0"` in `package.json`, with CI using `pnpm/action-setup@v4` (which reads that field) and Node 22 (pnpm 11 requires ≥22.13). Dependency caching uses `actions/setup-node`'s built-in pnpm cache. Security posture: `pnpm audit` must be clean at the high level — transitive vulnerabilities are patched via `overrides` in `pnpm-workspace.yaml`.

## Alternatives considered

- **Pin versions inside each workflow file** — exactly what drifted before; the workflow and the lockfile had no shared source of truth.
- **Downgrade local pnpm to 8** — walks away from lockfile v9 and current tooling.

## Consequences

- One version string governs local and CI; corepack picks it up automatically (`corepack enable`).
- CI builds need placeholder Supabase/Anthropic env vars (set in `quality.yml`) because client pages construct Supabase clients during prerender.
- The overrides list in `pnpm-workspace.yaml` must be pruned occasionally as upstream packages ship real fixes.
- Bumping pnpm majors in future = update `packageManager`, regenerate lockfile, verify CI — one PR.

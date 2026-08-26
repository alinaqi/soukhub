# Getting Started with SoukHub

This guide takes you from a fresh clone to a fully working local setup — app, database, auth, and AI assistant — in about 10 minutes.

SoukHub is an AI-powered order management platform for multi-channel marketplace sellers (Amazon UAE, Cartlow, Revibe). Next.js 16 + TypeScript + Supabase (PostgreSQL) + Anthropic Claude.

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | **22.13+** | Required by pnpm 11. [Download](https://nodejs.org/) |
| pnpm | **11.x** | Pinned via `packageManager` in package.json — run `corepack enable` and the right version is used automatically |
| Docker | any recent | Required for the local Supabase stack. [Docker Desktop](https://www.docker.com/products/docker-desktop/) must be **running** |
| Supabase CLI | 2.x | `brew install supabase/tap/supabase` (macOS) or [other installs](https://supabase.com/docs/guides/cli/getting-started) |
| Git | any | |

You'll also need an **Anthropic API key** for the AI assistant ([console.anthropic.com](https://console.anthropic.com/)). The app runs without it, but AI chat and AI-powered imports won't work.

## 1. Clone and install

```bash
git clone https://github.com/alinaqi/soukhub.git
cd soukhub
corepack enable   # ensures pnpm 11 per package.json
pnpm install
```

## 2. Start the local database

The entire Supabase stack (Postgres, Auth, REST, Studio) runs locally in Docker:

```bash
supabase start      # boots the stack (first run downloads images)
pnpm db:migrate     # applies all migrations from drizzle/ (Drizzle owns the schema — ADR 0015)
```

To rebuild from scratch later: `pnpm db:reset` (bare reset + re-apply all migrations).

This project uses **non-default ports (553xx)** to avoid clashing with other local Supabase projects:

| Service | URL |
|---------|-----|
| API (use as `NEXT_PUBLIC_SUPABASE_URL`) | http://127.0.0.1:55321 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:55322/postgres` |
| Studio (DB admin UI) | http://127.0.0.1:55323 |
| Mailpit (catches local emails) | http://127.0.0.1:55324 |

`supabase start` prints the **Publishable** and **Secret** keys you'll need next. Re-print them anytime with `supabase status`.

## 3. Configure environment

Copy the template and fill it in:

```bash
cp .env.example .env.local
```

```env
# From `supabase status`
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Publishable key from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<Secret key from supabase status>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55322/postgres

# AI assistant
ANTHROPIC_API_KEY=<your key from console.anthropic.com>

# App
NEXT_PUBLIC_APP_URL=http://localhost:4000
```

`.env.local` is gitignored — never commit real keys.

## 4. Run the app

```bash
pnpm dev
```

Open **http://localhost:4000** and create an account at `/signup`. Email confirmation is disabled locally, so you can log in immediately. Walk through onboarding, then import sample orders via the Import page (CSV/TSV exports from Amazon/Cartlow/Revibe).

Prefer a ready-made test user? Create one from the terminal:

```bash
curl -X POST "http://127.0.0.1:55321/auth/v1/admin/users" \
  -H "apikey: <Secret key>" -H "Authorization: Bearer <Secret key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@soukhub.local","password":"soukhub-test-123","email_confirm":true}'
```

## 5. Verify everything works

```bash
pnpm test --run    # unit tests (Vitest)
pnpm lint          # ESLint
pnpm typecheck     # tsc --noEmit
pnpm build         # production build
pnpm audit --audit-level=high   # should report 0 vulnerabilities
```

These are the same checks CI runs on every PR (`.github/workflows/quality.yml` and `security.yml`).

## Database access — how it works

Two layers by trust boundary (ADR 0015):

- **Drizzle ORM** (`src/db/`) — schema source of truth (`schema.ts`), migrations in `drizzle/`, and a server-only client that bypasses RLS (use where service-role access is intended).
- **supabase-js** — the RLS/auth surface: `src/lib/supabase/client.ts` (browser, anon key) and `server.ts` (cookie sessions). Regenerate its types after schema changes: `pnpm db:gen-types`.

Schema changes: edit `src/db/schema.ts` → `pnpm db:generate` (use `npx drizzle-kit generate --custom` for RLS policies/functions/triggers, which stay hand-written SQL) → `pnpm db:migrate` locally. **Merging to main deploys migrations to the hosted DB automatically** via `.github/workflows/db.yml` (requires the `DATABASE_URL` secret in the `production-db` environment).

## Optional: WhatsApp integration

Supplier messaging uses a **standalone microservice** in `whatsapp-service/` (whatsapp-web.js needs a persistent browser, which serverless can't provide). The production instance runs on Render. To run it locally:

```bash
cd whatsapp-service
npm install
API_KEY=dev-secret node src/index.js   # starts on :3001
```

Then add to `.env.local`:

```env
WHATSAPP_SERVICE_URL=http://localhost:3001
WHATSAPP_SERVICE_API_KEY=dev-secret
```

Connect your WhatsApp by scanning the QR code from the Communications page. This is optional — everything else works without it.

## Using a hosted Supabase project instead

If you'd rather not run Docker:

1. Create a project at [supabase.com](https://supabase.com/)
2. `supabase link --project-ref <your-project-ref>`
3. `supabase db push` to apply migrations
4. Point `.env.local` at the hosted URL and keys (Project Settings → API)

## Troubleshooting

- **`supabase start` port conflict** — another Supabase project is using the same ports. This repo already uses 553xx; if those clash too, change the `port` values in `supabase/config.toml`.
- **`pnpm install` fails with a TTY/modules-purge error** — run `CI=true pnpm install`.
- **pnpm complains about Node version** — pnpm 11 needs Node ≥ 22.13; check `node -v`.
- **Build fails with "supabaseUrl is required"** — `.env.local` is missing or incomplete.
- **AI chat returns errors** — check `ANTHROPIC_API_KEY` is set and valid; the model used is `claude-sonnet-5`.
- **Auth emails** — locally, all outgoing email lands in Mailpit at http://127.0.0.1:55324.

## Where to go next

- `docs/ARCHITECTURE.md` — system design
- `docs/API.md` — API routes
- `docs/IMPORT.md` — marketplace import formats
- `_project_specs/todos/` — roadmap and active work

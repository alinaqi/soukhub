# 0007. Local Supabase on non-default 553xx ports

- **Status**: Accepted
- **Date**: 2026-08-24

## Context

`supabase start` defaults to ports 543xx. Developers commonly run several Supabase projects on one machine, and the defaults collide — on the original dev machine, another project already occupied 54322, so this repo's local stack could not start.

## Decision

Commit **non-default ports (553xx)** in `supabase/config.toml`: API 55321, DB 55322, Studio 55323, Mailpit 55324, and matching shadow/pooler/analytics ports. `site_url` and redirect URLs point at the app's dev port **4000** (`next dev -p 4000`).

## Alternatives considered

- **Keep defaults, stop the other project** — pushes the conflict onto every contributor with multiple Supabase projects, silently.
- **Per-developer untracked config** — config.toml is one file; forking it per machine invites drift in the parts that matter (auth settings, migrations behavior).

## Consequences

- `.env.local` and all docs must use `http://127.0.0.1:55321`, not the 54321 you'll see in generic Supabase docs — this is the most common local-setup mistake in this repo.
- If 553xx is also taken on your machine, change the ports in `config.toml` locally but don't commit unless the team agrees.
- The database itself is unchanged; only host port mappings differ.

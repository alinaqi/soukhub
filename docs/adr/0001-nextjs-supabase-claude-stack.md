# 0001. Next.js + Supabase + Claude stack

- **Status**: Accepted
- **Date**: 2025-12-27

## Context

SoukHub is an AI-first order management app for solo/small marketplace sellers in the UAE. It needs auth, a relational database, server-side API routes, an AI assistant, and cheap, fast deployment — built and iterated on by a very small team.

## Decision

Full-stack TypeScript monolith: **Next.js (App Router) on Vercel**, **Supabase** for Postgres + auth, **Anthropic Claude** for all AI features.

## Alternatives considered

- **Python FastAPI + Postgres + separate React frontend** — better for heavy ML/data work, but doubles the deployment surface and splits the type system across two languages for a product that is mostly CRUD + LLM calls.
- **Express + MongoDB + OpenAI** — marketplace/order data is strongly relational (orders → items → products → suppliers); a document store fights the domain.

## Consequences

- One language, one repo, one deploy; Supabase RLS gives per-user data isolation without hand-rolled authorization.
- Vercel serverless imposes real limits: no long-running processes (see ADR 0005 for the WhatsApp consequence) and no background workers — long jobs must go to external services or scheduled functions.
- AI features are coupled to Anthropic's API; model IDs are set per call site (currently `claude-sonnet-5`), so model upgrades are a grep-and-bump.

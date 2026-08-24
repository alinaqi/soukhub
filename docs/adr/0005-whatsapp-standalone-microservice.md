# 0005. WhatsApp integration as a standalone microservice

- **Status**: Accepted
- **Date**: 2025-12-28

## Context

Suppliers in this market communicate on personal WhatsApp, not the WhatsApp Business API (which requires business verification, template approval, and per-message fees — a non-starter for small sellers). `whatsapp-web.js` automates WhatsApp Web but needs a persistent headless Chrome session, which Vercel serverless functions cannot host.

## Decision

Run WhatsApp automation as a **separate always-on Node/Express service** (`whatsapp-service/`, deployed on Render). The Next.js app talks to it over HTTP with a bearer token via `src/lib/whatsapp-client.ts` (send message, connection status, QR code for pairing). The service holds the browser session; the main app stays stateless.

## Alternatives considered

- **whatsapp-web.js inside Next.js** — tried first; fails on Vercel (no persistent process, no Chrome). The in-process fallback was removed as dead code.
- **WhatsApp Business Cloud API** — proper and supported, but verification burden and cost don't fit the target user today. This remains the long-term migration path.
- **Manual deep links only (`wa.me`)** — kept as the zero-setup fallback in the UI, but can't automate sending or read replies.

## Consequences

- Clean failure isolation: if the service is down, the app degrades to `wa.me` deep links.
- Two deployables instead of one; the service has its own `package.json`, tests, and Dockerfile, and is excluded from the main app's ESLint/dependency tree.
- WhatsApp Web automation is unofficial — sessions drop and WhatsApp could break it at any time. Treat it as best-effort and keep the manual path working.
- Revisit (→ Business Cloud API) when sellers scale past personal-account limits or reliability becomes contractual.

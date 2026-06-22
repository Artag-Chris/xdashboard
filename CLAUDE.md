# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Stack pinning

- **Next.js 16.2.6** (App Router) + **React 19.2** + **Tailwind v4** (`@tailwindcss/postcss`, no `tailwind.config.*` file — config lives in CSS) + **ESLint 9 flat config** (`eslint.config.mjs`).
- These are intentionally newer than common training data. Before writing routing, fetching, caching, or config code, consult `node_modules/next/dist/docs/01-app/` for the current API shape. AGENTS.md is the source of truth.

## Commands

- `npm run dev` — start Next dev server on :3000.
- `npm run dev:api` — regenerate the OpenAPI types **then** start dev. Use this after editing `spec/openapi.yaml`.
- `npm run generate:api` — regenerate `src/lib/api/schema.d.ts` from `spec/openapi.yaml` via `openapi-typescript`. Run this whenever the spec changes; the file is the only typed view of the backend.
- `npm run lint` — ESLint (Next core-web-vitals + TS rules).
- `npm run build` / `npm start` — production build / serve.

No test runner is configured.

## Architecture

### CQRS — Reads vs Writes

The backend uses **CQRS** — reads and writes go to different endpoints:

- **Reads (GETs):** all go to `/v1/query/*` → sync-service → MongoDB (read model). Exceptions:
  - `GET /v1/agent/conversations/:id` (agent detail with tool_use blocks)
  - `GET /v1/agent/memories` (agent memories)
  - `GET /v1/identity/report` (aggregate roll-up, not in read model)
  - `GET /v1/scheduler/*` (BullMQ jobs)
  - `GET /v1/messages/:id` (message audit)
  - `GET /v1/emails/domains` (config)

- **Writes (POST/PUT/PATCH/DELETE):** go to per-service endpoints (`/v1/conversations/*`, `/v1/identity/*`, `/v1/messages/send`, `/v1/emails`, `/v1/scraping/*`, `/v1/agent/*`)

See `docs/api/query.md` for the complete query API reference.

### Gateway-only API boundary

The frontend **never** calls microservices directly — only the gateway. Two paths:
1. **Dev (default):** `next.config.ts` rewrites `/api/:path*` → gateway.
2. **Override:** if `NEXT_PUBLIC_API_URL` is set, client code uses it as base URL directly.

### API typing flow

`spec/openapi.yaml` → `openapi-typescript` → `src/lib/api/schema.d.ts` → consumed by `openapi-fetch` (`apiClient`) and `apiFetch<T>()`. The `apiFetch` wrapper handles `202 Accepted` → `{ accepted: true }` for fire-and-forget writes.

### Real-time

- **Socket.IO** (`src/lib/socket.ts`): message status updates via `message:<id>` channel.
- **SSE** (`src/lib/sse/use-sse.ts`): scraping, email, scheduler, agent events via `GET /v1/events?topics=...`.

### Routing layout

- `src/app/page.tsx` — redirects to `/conversations`.
- `src/app/(dashboard)/` — route group with sidebar layout. All pages: `conversations/`, `messages/`, `emails/`, `scraping/`, `scheduler/`, `agent/`, `identity/`.

### Components

- `src/components/ui/` — primitive UI kit (`badge`, `button`, `card`, `input`, `modal`, `table`).
- `src/components/SendWhatsappForm.tsx` — reusable form with `useSendMessage` + `useMessageStatus`.

### Hooks

- `useSendMessage` — FSM (idle → sending → queued/error) for sending messages.
- `useMessageStatus` — Socket.IO listener for `message:<id>` updates.
- `useEventsStream` — SSE listener with `(topics[], handlers)` API.
- `useSSE` — typed SSE hook with event-name-to-payload mapping.

## Project conventions

- UI copy is **Spanish**.
- Sidebar uses inline emoji icons (no icon library).
- `apiFetch` throws parsed JSON error `{ statusCode, message }`.
- `@/*` → `./src/*` (path alias).

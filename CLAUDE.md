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

### Gateway-only API boundary

The frontend **never** calls microservices directly — only the gateway. There are two paths to that gateway depending on environment:

1. **Dev (default):** `next.config.ts` rewrites `/api/:path*` → `${API_GATEWAY_URL ?? "http://localhost:3000"}/api/:path*`. Client code calls relative `/api/...`.
2. **Override:** if `NEXT_PUBLIC_API_URL` is set (see `.env.local`, currently `https://micro.artagdev.com.co`), client code in `src/lib/api/client.ts` and `src/lib/sse/use-sse.ts` uses it as the base URL directly, bypassing the Next rewrite.

When debugging "wrong host" issues, check both `NEXT_PUBLIC_API_URL` and `API_GATEWAY_URL` — they control different layers.

### API typing flow

`spec/openapi.yaml` → `openapi-typescript` → `src/lib/api/schema.d.ts` → consumed by `openapi-fetch` (`apiClient`) in [src/lib/api/client.ts](src/lib/api/client.ts). The same file also exports `apiFetch<T>()`, an untyped escape hatch that handles `202 Accepted` → `{ accepted: true }` (the gateway uses fire-and-forget for many writes, marked `x-pattern: fire-and-forget` in the spec).

**Do not hand-edit `schema.d.ts`.** Edit the YAML and run `generate:api`.

### Real-time events (SSE)

The gateway exposes `GET /v1/events?topics=...` as a Server-Sent Events stream. [src/lib/sse/use-sse.ts](src/lib/sse/use-sse.ts) is the only consumer; [src/lib/sse/types.ts](src/lib/sse/types.ts) is the authoritative event-name → payload map (`SSEEventMap`). When adding a new event type:

1. Add the key + payload to `SSEEventMap`.
2. Add a matching `es.addEventListener(...)` call inside the `useEffect` in `use-sse.ts` — the hook does **not** auto-subscribe; each event name is wired explicitly.

Topic strings are namespaced (`scraping:*`, `email:*`, `agent:*`, `scheduler:*`, or `*`). Event name casing is inconsistent on purpose to match the gateway (`scraping:queued` uses `:`, `email.sent` uses `.`) — don't "fix" it without checking the backend contract.

### Routing layout

- `src/app/layout.tsx` — root html/body, Geist fonts, `min-h-full flex flex-col`.
- `src/app/page.tsx` — redirects to `/conversations`.
- `src/app/(dashboard)/` — route group with the shared sidebar layout ([src/app/(dashboard)/layout.tsx](src/app/(dashboard)/layout.tsx)). All authenticated pages live here: `conversations/`, `messages/`, `emails/`, `scraping/`, `scheduler/`, `agent/`, `identity/`. Detail routes use `[id]/` segments.
- The route group `(dashboard)` is **not** part of the URL — the dashboard index page is reached via `/` (which redirects) and links from the sidebar.

Pages that read live data are `"use client"` and fetch with `apiFetch` directly inside `useEffect` (no SWR / React Query in the project).

### Components

- `src/components/ui/` — primitive UI kit (`badge`, `button`, `card`, `empty-state`, `input`, `modal`, `table`). Use these instead of rolling new primitives.
- `src/components/channels/` and `src/components/forms/` exist as namespaces for channel-specific renderers and form composites.

### Path alias

`@/*` → `./src/*` (configured in `tsconfig.json`). Prefer this over relative paths that climb out of `src/app/`.

## Project conventions

- Strings in UI copy are Spanish (`Conversaciones`, `Mensajes`, `Tareas`, etc.) — keep new copy consistent.
- Sidebar uses inline emoji icons (no icon library is installed); follow the same pattern for new nav items.
- `apiFetch` throws the parsed JSON error object (not an `Error`), so `catch (e)` blocks see `{ statusCode, message }` shaped values from the gateway.

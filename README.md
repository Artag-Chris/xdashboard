# Dashboard — Frontend

Dashboard de gestión multicanal. Next.js 16 App Router + TypeScript + Tailwind CSS v4.

Consume exclusivamente el gateway API (`/api/v1/*`). No llama directo a microservicios.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| Lenguaje | TypeScript 5 (strict) |
| Estilos | Tailwind CSS v4 (sin config file — `@import "tailwindcss"` en globals.css) |
| Cliente API | `openapi-fetch` tipado desde spec + wrapper `apiFetch` |
| Tiempo real | Socket.IO (`message:<id>`) + SSE (scraping / email / scheduler / agent) |
| Tipos | `openapi-typescript` genera `src/lib/api/schema.d.ts` desde `spec/openapi.yaml` |

---

## Rutas

| Ruta | Página | Descripción |
|---|---|---|
| `/` | Dashboard | Redirige a `/conversations` |
| `/conversations` | Inbox | Lista de conversaciones con filtros, crear manual, archivar |
| `/conversations/[id]` | Detalle conversación | Mensajes, toggle IA, asignar agente, cambiar estado, archivar |
| `/messages` | Mensajes | Enviar mensajes multicanal (WhatsApp, Instagram, Slack, Facebook, Notion, TikTok) |
| `/messages/instagram` | Instagram DM | Endpoint directo para DMs |
| `/emails` | Emails | Enviar y listar emails |
| `/emails/[id]` | Detalle email | Provider, headers, eventos, adjuntos |
| `/scraping` | Scraping | Crear tareas con selectores/login/flow, listado |
| `/scraping/[id]` | Detalle scraping | SSE en vivo, delete, cleanup |
| `/scheduler` | Tareas programadas | CRUD de schedules |
| `/scheduler/[id]` | Detalle tarea | Pause/resume/trigger, ejecuciones, payload editor |
| `/agent` | Agente IA | Chat con SSE streaming (text-delta + tool-use), historial, memorias |
| `/identity` | Identidades | Listado de usuarios |
| `/identity/[id]` | Detalle identidad | Report stats, resolve, merge, toggle IA |

---

## Componentes UI

| Componente | Ubicación |
|---|---|
| `Badge` / `ChannelBadge` | `src/components/ui/badge.tsx` |
| `Button` | `src/components/ui/button.tsx` |
| `Card` / `StatCard` / `CardGrid` | `src/components/ui/card.tsx` |
| `EmptyState` | `src/components/ui/empty-state.tsx` |
| `Input` / `Select` / `TextArea` | `src/components/ui/input.tsx` |
| `Modal` | `src/components/ui/modal.tsx` |
| `Table` | `src/components/ui/table.tsx` |
| `SendWhatsappForm` | `src/components/SendWhatsappForm.tsx` |

---

## Hooks

| Hook | Propósito |
|---|---|
| `useSendMessage` | FSM (idle → sending → queued/error), envía a `/v1/messages/send` |
| `useMessageStatus` | Escucha `message:<id>` por Socket.IO (status real-time) |
| `useSSE` | SSE tipado con listeners por evento (scraping/email/scheduler/agent) |
| `useEventsStream` | SSE alternativo con API `(topics[], handlers)` |

---

## Tiempo real

- **Socket.IO**: status de envío de mensajes (`message:<id>`). Singleton en `src/lib/socket.ts`.
- **SSE**: scraping, email, scheduler, agent. Hook `useSSE` en `src/lib/sse/use-sse.ts`.

---

## Layout

```
src/
├── app/
│   ├── (dashboard)/          ← Route group con sidebar de navegación
│   │   ├── layout.tsx        ← Sidebar con links a todas las secciones
│   │   └── (pages)/
│   ├── globals.css
│   ├── layout.tsx            ← Root layout (fuentes, metadata)
│   └── page.tsx              ← Redirige a /conversations
├── components/
│   ├── SendWhatsappForm.tsx
│   └── ui/                   ← Componentes base (badge, button, card, input, modal, table)
├── hooks/
│   ├── useEventsStream.ts
│   ├── useMessageStatus.ts
│   └── useSendMessage.ts
└── lib/
    ├── api/
    │   ├── client.ts         ← Cliente HTTP (openapi-fetch + apiFetch wrapper)
    │   └── schema.d.ts       ← Tipos generados desde OpenAPI
    ├── socket.ts             ← Singleton Socket.IO
    └── sse/
        ├── types.ts
        └── use-sse.ts        ← Hook SSE tipado
```

---

## Variables de entorno

```env
# Pública — usada por apiFetch y Socket.IO
NEXT_PUBLIC_API_URL=https://micro.artagdev.com.co

# Solo para rewrites de desarrollo local (next dev)
API_GATEWAY_URL=http://localhost:3000
```

> Si el gateway sirve el frontend en el mismo origen (ej: `micro.artagdev.com.co`), las llamadas API van a `/api/v1/*` (same-origin, sin proxy). En desarrollo local, se usa `API_GATEWAY_URL` para las rewrites de Next.js.

---

## Scripts

```bash
npm run dev          # Desarrollo con Turbopack
npm run build        # Build production
npm run start        # Servir build
npm run lint         # ESLint
npm run generate:api # Regenerar tipos desde spec/openapi.yaml → schema.d.ts
npm run dev:api      # generate:api + dev
```

---

## Esquema OpenAPI

El archivo `spec/openapi.yaml` (~1874 líneas) es la fuente de verdad de la API. Para regenerar los tipos:

```bash
npm run generate:api
```

Esto actualiza `src/lib/api/schema.d.ts` automáticamente.

---

## Convenciones

- UI en **español**
- Iconos inline con **emojis** (sin librería de iconos)
- Los formularios incluyen **todos los campos DTO** documentados en el spec
- Llamadas API pasan por `apiFetch` — un wrapper que maneja status 202 (fire-and-forget) y errores
- Los hooks son dueños de su estado (sin Redux/Zustand)
- Proxy de desarrollo en `next.config.ts`: `/api/*` → gateway

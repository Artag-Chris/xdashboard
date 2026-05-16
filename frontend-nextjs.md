# Integración del front (Next.js 14+ App Router + TypeScript)

Guía pragmática para conectar tu front a este gateway. Cubre:
- Setup de la base URL y env vars
- Cliente HTTP tipado (sin libs extra — sólo `fetch`)
- Socket.IO singleton (status real-time en vez de polling)
- Hook `useSendMessage` listo para usar
- Hook `useEventsStream` para SSE (scraping, email, scheduler, agent)
- Component de ejemplo para enviar WhatsApp

> El gateway tiene **dos canales real-time**: Socket.IO para status de `/v1/messages` y SSE para todo lo demás. Lo ideal a futuro es unificarlos; por ahora usás los dos. Esta guía explica cuándo cada uno.

---

## 1. Setup inicial

### Variables de entorno

`.env.local` (en la raíz de tu proyecto Next):

```env
# Pública — accesible desde el browser. SIEMPRE prefijar con NEXT_PUBLIC_.
NEXT_PUBLIC_API_URL=https://micro.artagdev.com.co
```

> Para dev local del front + gateway en el mismo Docker: `NEXT_PUBLIC_API_URL=http://localhost:3000`.
>
> Recordá que en el server donde corre el gateway, `CORS_ALLOWED_ORIGINS` debe incluir el origen de tu front. Ejemplo: `CORS_ALLOWED_ORIGINS=http://localhost:3000,http://192.168.80.22:3000,https://app.tudominio.com`.

### Dependencias

```bash
pnpm add socket.io-client
# (No hace falta axios, swr ni react-query para esto — fetch alcanza)
```

---

## 2. Cliente HTTP tipado

`src/lib/api.ts`:

```ts
const BASE = process.env.NEXT_PUBLIC_API_URL!

if (!BASE) {
  throw new Error('NEXT_PUBLIC_API_URL no está seteada')
}

// Helper para hacer requests con tipos
export async function api<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = init
  const res = await fetch(`${BASE}/api${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : init.body,
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new ApiError(res.status, errBody, path)
  }

  // 202 Accepted con body, 200 con body, 204 sin body
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    public readonly path: string,
  ) {
    super(`API ${status} on ${path}: ${body.slice(0, 200)}`)
    this.name = 'ApiError'
  }
}
```

### Tipos del gateway (lo que el backend devuelve)

`src/lib/api-types.ts`:

```ts
// Mirror de /gateway/src/v1/messages/dto/message-response.dto.ts
export type Channel = 'whatsapp' | 'instagram' | 'slack' | 'notion' | 'tiktok' | 'facebook'

export type MessageStatus = 'PENDING' | 'SENT' | 'FAILED' | 'PARTIAL'

export interface SendMessageRequest {
  channel: Channel
  recipients: string[]
  message: string
  mediaUrl?: string | null
  /** Solo para `channel: 'notion'` */
  operation?: 'create_page' | 'create_task' | 'invite_member'
  metadata?: Record<string, unknown>
}

/** Response del POST /v1/messages/send (202 Accepted) */
export interface MessageResponse {
  id: string                 // ← el ID que devuelve el gateway (NO "messageId")
  accepted: boolean
  channel: string
  recipients: string[]
  message: string
  status: MessageStatus
  createdAt: string          // ISO date
}

/** Payload del evento `message:<id>` por WebSocket cuando llega la respuesta del microservicio */
export interface MessageStatusUpdate {
  status: 'SENT' | 'FAILED' | 'PARTIAL'
  sentCount: number
  failedCount: number
  errors?: Array<{ recipient: string; reason: string }> | null
  timestamp: string
}
```

---

## 3. Socket.IO singleton (status de mensajes)

`src/lib/socket.ts`:

```ts
'use client'

import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

/**
 * Devuelve un socket compartido. Conecta lazy al primer uso.
 * Pensado para vivir mientras dure el tab — no lo desconectes en cada render.
 */
export function getSocket(): Socket {
  if (typeof window === 'undefined') {
    throw new Error('getSocket() solo se usa en cliente, no en SSR')
  }
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      transports: ['websocket'], // saltea el long-polling, va directo a WS
      autoConnect: true,
    })
    socket.on('connect',    () => console.log('[ws] connected', socket?.id))
    socket.on('disconnect', () => console.log('[ws] disconnected'))
    socket.on('connect_error', (e) => console.warn('[ws] connect_error', e.message))
  }
  return socket
}
```

### Hook React: `useMessageStatus`

`src/hooks/useMessageStatus.ts`:

```ts
'use client'

import { useEffect, useState } from 'react'
import { getSocket } from '../lib/socket'
import type { MessageStatusUpdate } from '../lib/api-types'

/**
 * Escucha el evento `message:<id>` y devuelve el último status recibido.
 * Devuelve `null` mientras no hay update todavía.
 */
export function useMessageStatus(messageId: string | null): MessageStatusUpdate | null {
  const [status, setStatus] = useState<MessageStatusUpdate | null>(null)

  useEffect(() => {
    if (!messageId) return
    setStatus(null)

    const socket = getSocket()
    const channel = `message:${messageId}`
    const onUpdate = (payload: MessageStatusUpdate) => setStatus(payload)

    socket.on(channel, onUpdate)
    return () => {
      socket.off(channel, onUpdate)
    }
  }, [messageId])

  return status
}
```

---

## 4. Hook React: `useSendMessage`

`src/hooks/useSendMessage.ts`:

```ts
'use client'

import { useCallback, useState } from 'react'
import { api } from '../lib/api'
import type { MessageResponse, SendMessageRequest } from '../lib/api-types'

type State =
  | { phase: 'idle' }
  | { phase: 'sending' }
  | { phase: 'queued';  response: MessageResponse }
  | { phase: 'error';   error: string }

export function useSendMessage() {
  const [state, setState] = useState<State>({ phase: 'idle' })

  const send = useCallback(async (req: SendMessageRequest) => {
    setState({ phase: 'sending' })
    try {
      const response = await api<MessageResponse>('/v1/messages/send', {
        method: 'POST',
        json: req,
      })
      setState({ phase: 'queued', response })
      return response
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      setState({ phase: 'error', error })
      throw err
    }
  }, [])

  const reset = useCallback(() => setState({ phase: 'idle' }), [])

  return { state, send, reset }
}
```

---

## 5. Componente de ejemplo: enviar WhatsApp con status real-time

`src/components/SendWhatsappForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useSendMessage } from '../hooks/useSendMessage'
import { useMessageStatus } from '../hooks/useMessageStatus'

export function SendWhatsappForm() {
  const [phone, setPhone] = useState('573205711428')
  const [text, setText]   = useState('hello')

  const { state, send } = useSendMessage()

  // Cuando el POST devuelve `id`, el hook se suscribe al WS y empieza a recibir status
  const messageId = state.phase === 'queued' ? state.response.id : null
  const status    = useMessageStatus(messageId)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await send({
      channel: 'whatsapp',
      recipients: [phone],
      message: text,
    }).catch(() => {}) // el state ya queda en 'error'
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 400 }}>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="57..." />
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <button type="submit" disabled={state.phase === 'sending'}>
        {state.phase === 'sending' ? 'Enviando...' : 'Enviar'}
      </button>

      {state.phase === 'error' && (
        <p style={{ color: 'crimson' }}>Error: {state.error}</p>
      )}

      {state.phase === 'queued' && (
        <div>
          <p>Encolado con id <code>{state.response.id}</code></p>
          <p>
            Status:{' '}
            {status
              ? `${status.status} (sent=${status.sentCount}, failed=${status.failedCount})`
              : 'esperando confirmación del microservicio...'}
          </p>
          {status?.errors?.length ? (
            <ul>
              {status.errors.map((e, i) => (
                <li key={i}>{e.recipient}: {e.reason}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </form>
  )
}
```

Y en una página App Router cualquiera:

```tsx
// app/page.tsx
import { SendWhatsappForm } from '@/components/SendWhatsappForm'

export default function Home() {
  return <SendWhatsappForm />
}
```

---

## 6. Bonus — SSE para scraping / email / scheduler / agent

Para todo lo que **no es `/v1/messages`**, usá el SSE bus (más simple que Socket.IO, sin lib extra).

`src/hooks/useEventsStream.ts`:

```ts
'use client'

import { useEffect } from 'react'

/**
 * Suscripción a Server-Sent Events del gateway.
 *
 * `topics` es un array tipo: ['scraping:abc', 'email:*', 'agent:conv-uuid']
 * `handlers` mapea nombre de evento → callback (ej: 'scraping:completed').
 */
export function useEventsStream(
  topics: string[],
  handlers: Record<string, (data: unknown) => void>,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled || topics.length === 0) return

    const url = new URL('/api/v1/events', process.env.NEXT_PUBLIC_API_URL!)
    url.searchParams.set('topics', topics.join(','))

    const es = new EventSource(url.toString())

    const cleanups: Array<() => void> = []
    for (const [event, handler] of Object.entries(handlers)) {
      const wrapped = (e: MessageEvent) => {
        try {
          handler(JSON.parse(e.data))
        } catch (err) {
          console.warn('[sse] bad payload for', event, err)
        }
      }
      es.addEventListener(event, wrapped)
      cleanups.push(() => es.removeEventListener(event, wrapped))
    }

    es.onerror = (e) => console.warn('[sse] error', e)

    return () => {
      cleanups.forEach((fn) => fn())
      es.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, topics.join(',')])
}
```

Uso típico — escuchar un scraping específico hasta que termine:

```tsx
function ScrapingProgress({ jobId }: { jobId: string }) {
  const [state, setState] = useState({ status: 'pending', data: null as any })

  useEventsStream(
    [`scraping:${jobId}`],
    {
      'scraping:started':   () => setState((s) => ({ ...s, status: 'running' })),
      'scraping:completed': (data: any) => setState({ status: 'success', data: data.data }),
      'scraping:failed':    (data: any) => setState({ status: 'failed', data: data.error }),
    },
  )

  return <pre>{JSON.stringify(state, null, 2)}</pre>
}
```

---

## 7. Estructura sugerida del proyecto

```
src/
├── app/
│   └── page.tsx
├── components/
│   └── SendWhatsappForm.tsx
├── hooks/
│   ├── useSendMessage.ts
│   ├── useMessageStatus.ts
│   └── useEventsStream.ts
└── lib/
    ├── api.ts          ← cliente fetch
    ├── api-types.ts    ← tipos espejos del backend
    └── socket.ts       ← singleton Socket.IO
```

Mantenelo simple. No hace falta Redux/Zustand para esto — los hooks dueños de su estado ya alcanzan. Si querés invalidar listas (ej: lista de emails enviados después de mandar uno), agregá [TanStack Query](https://tanstack.com/query) más adelante.

---

## 8. Checklist de los errores comunes (los que ya tuviste)

| Síntoma | Causa | Fix |
|---|---|---|
| `OPTIONS /api/v1/... → 404` | CORS no habilitado en gateway | `CORS_ALLOWED_ORIGINS` en el `.env` del server + rebuild |
| `GET /api/v1/messages/undefined` | Front lee `response.messageId` (no existe) | Leer **`response.id`** |
| Path va sin `/api` | Gateway tiene `setGlobalPrefix('api')` | Siempre `/api/v1/...` (el helper `api()` lo hace por vos) |
| Polling cada 2s | Real-time existe, no se está usando | `useMessageStatus(id)` (WS) o `useEventsStream(...)` (SSE) |
| WS no conecta detrás de Cloudflare | `transports: ['polling']` por default | Forzar `transports: ['websocket']` (ya está en `getSocket`) |
| `Network Error` desde el browser | URL hardcodeada o mal seteada | `NEXT_PUBLIC_API_URL` en `.env.local` |

---

## 9. Próximos pasos sugeridos

Cuando el flujo básico esté andando, en este orden:

1. **Auth real** — el gateway tiene JWT wired pero comentado. Cuando se active, todos los endpoints `/v1/*` van a pedir `Authorization: Bearer <token>`. Modificar `api()` para inyectarlo desde un store (cookie http-only, idealmente).
2. **Optimistic UI** — mostrar el mensaje como "enviando" antes de que llegue el `id`, y reemplazar con datos reales cuando responde el POST.
3. **TanStack Query** — para listas (ej: histórico de mensajes, conversaciones del agente) con cache + invalidación.
4. **Toasts/notificaciones** — usar [sonner](https://sonner.emilkowal.ski/) o similar para mostrar success/error globales.
5. **Unificar real-time** — pedirle al backend que mueva los status de mensajes al SSE bus (`/v1/events?topics=message:<id>`) para tener UN solo canal y eliminar la dependencia de Socket.IO.

import createClient from "openapi-fetch";
import type { paths } from "./schema";

/**
 * Base URL del gateway incluyendo el prefix /api.
 * El gateway tiene setGlobalPrefix('api'), así que todas las rutas son /api/v1/...
 * - Producción/dev con gateway remoto: `https://micro.artagdev.com.co/api`
 * - Dev local con rewrite de Next: `/api`
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api`
  : "/api";

export const apiClient = createClient<paths>({
  baseUrl: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function apiFetch<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({
      statusCode: res.status,
      message: res.statusText,
    }));
    throw error;
  }

  if (res.status === 202) {
    return { accepted: true } as T;
  }

  return res.json();
}

import { apiFetch } from "@/lib/api/client";
import type { IApiClient } from "../core/ports";

export class ApiClient implements IApiClient {
  async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const search = params
      ? "?" + new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== "")
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    return apiFetch<T>(`${path}${search}`);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return apiFetch<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return apiFetch<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string): Promise<T> {
    return apiFetch<T>(path, { method: "DELETE" });
  }
}

"use client";

import { useEffect } from "react";

const BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")
  : "";

export function useEventsStream(
  topics: string[],
  handlers: Record<string, (data: unknown) => void>,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled || topics.length === 0) return;

    const url = new URL("/api/v1/events", BASE || undefined);
    url.searchParams.set("topics", topics.join(","));

    const es = new EventSource(url.toString());

    const cleanups: Array<() => void> = [];
    for (const [event, handler] of Object.entries(handlers)) {
      const wrapped = (e: MessageEvent) => {
        try {
          handler(JSON.parse(e.data));
        } catch (err) {
          console.warn("[sse] bad payload for", event, err);
        }
      };
      es.addEventListener(event, wrapped);
      cleanups.push(() => es.removeEventListener(event, wrapped));
    }

    es.onerror = (e) => console.warn("[sse] error", e);

    return () => {
      cleanups.forEach((fn) => fn());
      es.close();
    };
  }, [enabled, topics.join(",")]);
}

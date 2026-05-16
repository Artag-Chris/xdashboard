"use client";

import { useEffect, useRef, useCallback } from "react";
import { API_BASE } from "@/lib/api/client";
import type { SSEEventType, SSEEventMap, SSETopic } from "./types";

type SSECallback<E extends SSEEventType> = (data: SSEEventMap[E]) => void;

interface UseSSEOptions {
  topics: SSETopic[];
  onEvent?: <E extends SSEEventType>(
    event: E,
    data: SSEEventMap[E]
  ) => void;
  onError?: (error: Event) => void;
}

export function useSSE(options: UseSSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const listenersRef = useRef<
    Map<SSEEventType, Set<SSECallback<SSEEventType>>>
  >(new Map());
  const onErrorRef = useRef(options.onError);
  const onEventRef = useRef(options.onEvent);
  useEffect(() => {
    onErrorRef.current = options.onError;
    onEventRef.current = options.onEvent;
  });

  const addListener = useCallback(
    <E extends SSEEventType>(event: E, cb: SSECallback<E>) => {
      if (!listenersRef.current.has(event)) {
        listenersRef.current.set(event, new Set());
      }
      listenersRef.current.get(event)!.add(cb as SSECallback<SSEEventType>);

      return () => {
        listenersRef.current.get(event)?.delete(cb as SSECallback<SSEEventType>);
      };
    },
    []
  );

  const topicsKey = options.topics.join(",");

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/v1/events?topics=${topicsKey}`);

    es.addEventListener("scraping:queued", (e) =>
      dispatch(e, "scraping:queued")
    );
    es.addEventListener("scraping:started", (e) =>
      dispatch(e, "scraping:started")
    );
    es.addEventListener("scraping:completed", (e) =>
      dispatch(e, "scraping:completed")
    );
    es.addEventListener("scraping:failed", (e) =>
      dispatch(e, "scraping:failed")
    );

    es.addEventListener("email.sent", (e) => dispatch(e, "email.sent"));
    es.addEventListener("email.delivered", (e) =>
      dispatch(e, "email.delivered")
    );
    es.addEventListener("email.bounced", (e) =>
      dispatch(e, "email.bounced")
    );
    es.addEventListener("email.opened", (e) => dispatch(e, "email.opened"));
    es.addEventListener("email.clicked", (e) =>
      dispatch(e, "email.clicked")
    );
    es.addEventListener("email.complained", (e) =>
      dispatch(e, "email.complained")
    );
    es.addEventListener("email:inbound", (e) =>
      dispatch(e, "email:inbound")
    );

    es.addEventListener("scheduler:task-fired", (e) =>
      dispatch(e, "scheduler:task-fired")
    );

    es.addEventListener("agent:message-started", (e) =>
      dispatch(e, "agent:message-started")
    );
    es.addEventListener("agent:text-delta", (e) =>
      dispatch(e, "agent:text-delta")
    );
    es.addEventListener("agent:tool-use-start", (e) =>
      dispatch(e, "agent:tool-use-start")
    );
    es.addEventListener("agent:tool-use-end", (e) =>
      dispatch(e, "agent:tool-use-end")
    );
    es.addEventListener("agent:message-completed", (e) =>
      dispatch(e, "agent:message-completed")
    );
    es.addEventListener("agent:error", (e) => dispatch(e, "agent:error"));

    es.onerror = (err) => {
      onErrorRef.current?.(err);
    };

    eventSourceRef.current = es;

    function dispatch(e: MessageEvent, eventType: SSEEventType) {
      try {
        const data = JSON.parse(e.data) as SSEEventMap[typeof eventType];
        listenersRef.current.get(eventType)?.forEach((cb) => cb(data));
        onEventRef.current?.(eventType, data);
      } catch {
        console.warn(`SSE: failed to parse ${eventType} event`);
      }
    }

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [topicsKey]);

  return { addListener, close: () => eventSourceRef.current?.close() };
}

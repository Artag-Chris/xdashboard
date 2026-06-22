"use client";

import { useState, useEffect, useCallback } from "react";
import { useGateway } from "./context";
import type {
  IdentityReport,
  EmailDomain,
  SendMessageDto,
  CreateScrapingTaskDto,
  ChatDto,
  DashboardStats,
  RecentConversation,
  UnifiedUser,
  UnifiedConversation,
  UnifiedMessage,
  UnifiedEmail,
  ScrapingTaskSummary,
  PaginatedResponse,
} from "../types";

// ── Cursor pagination hook ──

function useCursorPaginated<T>(
  fetcher: (cursor?: string) => Promise<PaginatedResponse<T>>,
) {
  const [data, setData] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetcher(cursor);
      setData((prev) => [...prev, ...res.data]);
      setCursor(res.cursor);
      if (!res.cursor || res.data.length === 0) setHasMore(false);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [cursor, fetcher]);

  const refresh = useCallback(async () => {
    setData([]);
    setCursor(undefined);
    setHasMore(true);
    const res = await fetcher(undefined);
    setData(res.data);
    setCursor(res.cursor);
    if (!res.cursor) setHasMore(false);
  }, [fetcher]);

  return { data, loading, error, hasMore, loadMore: load, refresh };
}

// ── Query Hooks ──

export function useUsers(params?: { limit?: number }) {
  const { api } = useGateway();
  return useCursorPaginated((cursor) =>
    api.get<PaginatedResponse<UnifiedUser>>("/v1/query/users", { ...params, cursor })
  );
}

export function useUser(userId: string | undefined) {
  const { api } = useGateway();
  const [data, setData] = useState<UnifiedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    api.get<UnifiedUser>(`/v1/query/users/${encodeURIComponent(userId)}`)
      .then((user) => { if (!cancelled) setData(user); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, api]);

  return { data, loading };
}

export function useConversations(params?: { channel?: string; status?: string; limit?: number }) {
  const { api } = useGateway();
  return useCursorPaginated((cursor) =>
    api.get<PaginatedResponse<UnifiedConversation>>("/v1/query/conversations", { ...params, cursor })
  );
}

export function useConversationMessages(conversationId: string | undefined, params?: { limit?: number }) {
  const { api } = useGateway();
  return useCursorPaginated((cursor) =>
    conversationId
      ? api.get<PaginatedResponse<UnifiedMessage>>(
          `/v1/query/conversations/${encodeURIComponent(conversationId)}/messages`,
          { ...params, cursor }
        )
      : Promise.resolve({ data: [] })
  );
}

export function useEmails(params?: { direction?: string; domain?: string; status?: string; limit?: number }) {
  const { api } = useGateway();
  return useCursorPaginated((cursor) =>
    api.get<PaginatedResponse<UnifiedEmail>>("/v1/query/emails", { ...params, cursor })
  );
}

export function useScrapingTasks(params?: { status?: string; limit?: number }) {
  const { api } = useGateway();
  return useCursorPaginated((cursor) =>
    api.get<PaginatedResponse<ScrapingTaskSummary>>("/v1/query/scraping-tasks", { ...params, cursor })
  );
}

export function useSearch() {
  const { api } = useGateway();
  const [results, setResults] = useState<PaginatedResponse<UnifiedMessage> | null>(null);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) return;
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<UnifiedMessage>>("/v1/query/search", { q });
      setResults(res);
    } finally {
      setLoading(false);
    }
  }, [api]);

  return { results, loading, search };
}

// ── Dashboard Hooks ──

export function useDashboardStats() {
  const { api, identity } = useGateway();
  const [stats, setStats] = useState<DashboardStats>({
    conversations: 0, messagesSent: 0, emailsSent: 0,
    scrapingJobs: 0, activeSchedules: 0, totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [convosRes, identityReport] = await Promise.allSettled([
          api.get<PaginatedResponse<RecentConversation>>("/v1/query/conversations?limit=5"),
          identity.getReport(),
        ]);
        if (convosRes.status === "fulfilled") {
          setStats((s) => ({ ...s, conversations: convosRes.value.data.length }));
        }
        if (identityReport.status === "fulfilled") {
          setStats((s) => ({ ...s, totalUsers: identityReport.value.totalUsers }));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [api, identity]);

  return { stats, loading };
}

export function useIdentityReport() {
  const { identity } = useGateway();
  const [report, setReport] = useState<IdentityReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    identity.getReport().then(setReport).finally(() => setLoading(false));
  }, [identity]);

  return { report, loading };
}

// ── Email Hooks ──

export function useDomains() {
  const { email } = useGateway();
  const [domains, setDomains] = useState<EmailDomain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    email.listDomains().then(setDomains).finally(() => setLoading(false));
  }, [email]);

  return { domains, loading };
}

// ── Messages Hooks ──

export function useSendMessage() {
  const { messages } = useGateway();
  const [sending, setSending] = useState(false);

  const send = useCallback(async (dto: SendMessageDto) => {
    setSending(true);
    try {
      return await messages.send(dto);
    } finally {
      setSending(false);
    }
  }, [messages]);

  return { send, sending };
}

// ── Scraping Hooks ──

export function useCreateScrapingTask() {
  const { scraping } = useGateway();
  const [loading, setLoading] = useState(false);

  const create = useCallback(async (dto: CreateScrapingTaskDto) => {
    setLoading(true);
    try {
      return await scraping.createTask(dto);
    } finally {
      setLoading(false);
    }
  }, [scraping]);

  return { create, loading };
}

// ── Agent Hooks ──

export function useChat() {
  const { agent } = useGateway();
  const [loading, setLoading] = useState(false);

  const chat = useCallback(async (dto: ChatDto) => {
    setLoading(true);
    try {
      return await agent.chat(dto);
    } finally {
      setLoading(false);
    }
  }, [agent]);

  return { chat, loading };
}

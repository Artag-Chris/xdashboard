"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, TextArea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useGateway } from "@/lib/microservices/react/context";
import { useSSE } from "@/lib/sse/use-sse";
import type { SSEEventMap } from "@/lib/sse/types";
import type { ScrapingTaskSummary } from "@/lib/microservices/types";

const STRATEGIES = [
  { value: "auto", label: "Auto" },
  { value: "extract", label: "Extract" },
  { value: "search", label: "Search" },
  { value: "login_then_extract", label: "Login then extract" },
  { value: "login_then_search", label: "Login then search" },
  { value: "custom_flow", label: "Custom flow" },
];

export default function ScrapingPage() {
  const { api, scraping } = useGateway();
  const [tasks, setTasks] = useState<ScrapingTaskSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [url, setUrl] = useState("");
  const [strategy, setStrategy] = useState("auto");
  const [selectors, setSelectors] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.get<ScrapingTaskSummary[]>("/v1/query/scraping-tasks")
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [api]);

  useSSE({
    topics: ["scraping:*"],
    onEvent: (event, data) => {
      const d = data as SSEEventMap["scraping:completed" | "scraping:failed" | "scraping:started"];
      if ("jobId" in d) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === d.jobId
              ? {
                  ...t,
                  status: (event === "scraping:completed" ? "completed" : event === "scraping:failed" ? "failed" : "completed") as ScrapingTaskSummary["status"],
                  durationMs: event === "scraping:completed" ? (d as SSEEventMap["scraping:completed"]).durationMs : t.durationMs,
                  error: event === "scraping:failed" ? (d as SSEEventMap["scraping:failed"]).error ?? null : t.error,
                }
              : t
          )
        );
      }
    },
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const selectorsParsed = selectors ? JSON.parse(selectors) : undefined;
      const res = await scraping.createTask({
        url,
        strategy: strategy as ScrapingTaskSummary["status"], // cast reuse; real type is ScrapingStrategy
        ...(selectorsParsed && { selectors: selectorsParsed }),
      });
      setTasks((prev) => [
        {
          id: res.requestId, userId: null, url, title: null,
          status: "completed" as const, notionPageUrl: null,
          durationMs: null, error: null,
          occurredAt: new Date().toISOString(), createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setUrl(""); setSelectors("");
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  async function deleteTask(taskId: string) {
    try {
      await scraping.remove(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch { /* ignore */ }
  }

  async function cleanupExpired() {
    try {
      await scraping.cleanupExpired();
    } catch { /* ignore */ }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Scraping</h1>
        <Button variant="secondary" size="sm" onClick={cleanupExpired}>Limpiar expirados</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <Card title="Nueva tarea">
            <form onSubmit={handleCreate} className="space-y-4">
              <Input label="URL *" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" required />
              <Select label="Estrategia" value={strategy} onChange={(e) => setStrategy(e.target.value)} options={STRATEGIES} />
              <TextArea label="Selectors (JSON opcional)" value={selectors} onChange={(e) => setSelectors(e.target.value)} rows={4} placeholder='{"title": ".main-title", "price": ".price-value"}' />
              <Button type="submit" loading={creating} className="w-full">Crear tarea</Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card title="Tareas">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Cargando...</div>
            ) : tasks.length === 0 ? (
              <EmptyState icon="🕷️" title="Sin tareas" description="Crea una tarea para empezar a scrapear" />
            ) : (
              <div className="divide-y divide-gray-100">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between py-3 px-5 hover:bg-gray-50 transition-colors -mx-5 first:-mt-5 last:-mb-5 group">
                    <a href={`/scraping/${task.id}`} className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate hover:text-blue-600">
                        {task.title ?? task.url}
                      </p>
                      <p className="text-xs text-gray-500">
                        {task.durationMs && `${(task.durationMs / 1000).toFixed(1)}s`}
                        {task.durationMs && " · "}
                        {new Date(task.occurredAt).toLocaleDateString()}
                        {task.error && ` · ${task.error}`}
                      </p>
                    </a>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge status={task.status} />
                      <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100" onClick={() => deleteTask(task.id)}>Eliminar</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

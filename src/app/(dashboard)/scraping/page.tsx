"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, TextArea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { apiFetch } from "@/lib/api/client";
import { useSSE } from "@/lib/sse/use-sse";
import type { SSEEventMap } from "@/lib/sse/types";

type ScrapingTask = {
  id: string;
  url: string;
  strategy: string;
  status: string;
  result: Record<string, unknown> | null;
  userId?: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  expiresAt: string;
  createdAt: string;
};

const STRATEGIES = [
  { value: "auto", label: "Auto — extracción inteligente" },
  { value: "extract", label: "Extract — selectores CSS/XPath" },
  { value: "search", label: "Search — buscar término en el sitio" },
  { value: "login_then_extract", label: "Login + extraer contenido" },
  { value: "login_then_search", label: "Login + buscar + extraer" },
  { value: "custom_flow", label: "Custom flow — pasos personalizados" },
];

export default function ScrapingPage() {
  const [tasks, setTasks] = useState<ScrapingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [url, setUrl] = useState("");
  const [strategy, setStrategy] = useState("extract");
  const [selectors, setSelectors] = useState("");
  const [sessionKey, setSessionKey] = useState("");
  const [flowSteps, setFlowSteps] = useState("");
  const [blockResources, setBlockResources] = useState(true);
  const [timeoutMs, setTimeoutMs] = useState("30000");
  const [outputNotion, setOutputNotion] = useState(false);
  const [outputWhatsapp, setOutputWhatsapp] = useState("");
  const [outputEmail, setOutputEmail] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    apiFetch<ScrapingTask[]>("/v1/scraping/tasks?limit=20")
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

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
                  status: event === "scraping:completed" ? "SUCCESS" : event === "scraping:failed" ? "FAILED" : "RUNNING",
                  result: event === "scraping:completed" ? (d as SSEEventMap["scraping:completed"]).data : t.result,
                  completedAt: event !== "scraping:started" ? new Date().toISOString() : t.completedAt,
                  durationMs: event === "scraping:completed" ? (d as SSEEventMap["scraping:completed"]).durationMs : t.durationMs,
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

    let parsedSelectors: Record<string, unknown> | undefined;
    if (selectors.trim()) {
      try { parsedSelectors = JSON.parse(selectors); } catch { /* ignore */ }
    }

    let parsedFlow: Record<string, unknown>[] | undefined;
    if (flowSteps.trim() && strategy === "custom_flow") {
      try { parsedFlow = JSON.parse(flowSteps); } catch { /* ignore */ }
    }

    const body: Record<string, unknown> = { url, strategy };
    if (parsedSelectors) body.selectors = parsedSelectors;
    if (parsedFlow) body.flow = parsedFlow;

    body.performance = {
      blockResources,
      timeoutMs: parseInt(timeoutMs) || 30000,
    };

    if (sessionKey && (strategy.startsWith("login_then"))) {
      body.login = { sessionKey };
    }

    const targets: string[] = ["event"];
    const output: Record<string, unknown> = { targets };
    if (outputNotion) output.notion = {};
    if (outputWhatsapp) output.whatsapp = { to: outputWhatsapp };
    if (outputEmail) output.email = { to: [outputEmail], subject: "Resultado scraping" };
    if (output.email || output.notion || output.whatsapp) body.output = output;

    try {
      const res = await apiFetch<{ jobId: string }>("/v1/scraping/tasks", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setTasks((prev) => [
        {
          id: res.jobId, url, strategy, status: "QUEUED", result: null,
          startedAt: null, completedAt: null, durationMs: null,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setShowCreate(false);
      setUrl(""); setSelectors(""); setSessionKey(""); setFlowSteps("");
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  async function deleteTask(taskId: string) {
    try {
      await apiFetch(`/v1/scraping/tasks/${taskId}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch {
      // ignore
    }
  }

  async function cleanupExpired() {
    try {
      const res = await apiFetch<{ deleted: number }>("/v1/scraping/cleanup-expired", { method: "POST" });
      alert(`Se eliminaron ${res.deleted} tareas expiradas`);
    } catch {
      // ignore
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Web Scraping</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={cleanupExpired}>
            Limpiar expiradas
          </Button>
          <Button onClick={() => setShowCreate(true)}>Nueva tarea</Button>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva tarea de scraping">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
          />
          <Select
            label="Estrategia"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            options={STRATEGIES}
          />
          <TextArea
            label="Selectores (JSON)"
            value={selectors}
            onChange={(e) => setSelectors(e.target.value)}
            rows={4}
            placeholder='{"title": "h1", "price": ".price"}'
          />

          {strategy.startsWith("login_then") && (
            <Input
              label="Session Key (para persistir login)"
              value={sessionKey}
              onChange={(e) => setSessionKey(e.target.value)}
              placeholder="mi-sesion-linkedin"
            />
          )}

          {strategy === "custom_flow" && (
            <TextArea
              label="Flow steps (JSON array)"
              value={flowSteps}
              onChange={(e) => setFlowSteps(e.target.value)}
              rows={4}
              placeholder='[{"type": "navigate", "url": "..."}, {"type": "wait", "selector": ".loaded"}]'
            />
          )}

          <div className="border-t border-gray-200 pt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Rendimiento</p>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="blockResources"
                checked={blockResources}
                onChange={(e) => setBlockResources(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="blockResources" className="text-sm text-gray-600">
                Bloquear recursos (imágenes, CSS) — 3-5x más rápido
              </label>
            </div>
            <Input
              label="Timeout (ms)"
              type="number"
              value={timeoutMs}
              onChange={(e) => setTimeoutMs(e.target.value)}
            />
          </div>

          <div className="border-t border-gray-200 pt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Enviar resultado a</p>
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" id="outputNotion" checked={outputNotion}
                onChange={(e) => setOutputNotion(e.target.checked)} className="rounded" />
              <label htmlFor="outputNotion" className="text-sm text-gray-600">Notion</label>
            </div>
            <Input
              label="WhatsApp (número)"
              value={outputWhatsapp}
              onChange={(e) => setOutputWhatsapp(e.target.value)}
              placeholder="573205711428"
            />
            <Input
              label="Email"
              value={outputEmail}
              onChange={(e) => setOutputEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <Button type="submit" loading={creating} className="w-full">
            Iniciar scraping
          </Button>
        </form>
      </Modal>

      <Card>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon="🕷️"
            title="Sin tareas"
            description="Crea una tarea de scraping para empezar. Las actualizaciones llegan en vivo."
            action={<Button onClick={() => setShowCreate(true)}>Crear primera tarea</Button>}
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between py-4 px-5 hover:bg-gray-50 transition-colors -mx-5 first:-mt-5 last:-mb-5"
              >
                <a href={`/scraping/${task.id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate hover:text-blue-600">
                    {task.url}
                  </p>
                  <p className="text-xs text-gray-500">
                    {task.strategy}
                    {task.durationMs && ` · ${(task.durationMs / 1000).toFixed(1)}s`}
                    {task.createdAt && ` · ${new Date(task.createdAt).toLocaleDateString()}`}
                  </p>
                </a>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge status={task.status} />
                  <Button size="sm" variant="ghost" onClick={() => deleteTask(task.id)}>
                    Borrar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { apiFetch } from "@/lib/api/client";
import { useSSE } from "@/lib/sse/use-sse";

type ScheduledTask = {
  id: string;
  name: string;
  scheduleType: string;
  cronExpression: string | null;
  intervalMs: number | null;
  runAt: string | null;
  targetRoutingKey: string;
  status: string;
  nextFireAt: string | null;
  fireCount: number;
  failureCount: number;
  lastFiredAt: string | null;
  createdAt: string;
};

export default function SchedulerPage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleType, setScheduleType] = useState("CRON");
  const [cronExpression, setCronExpression] = useState("0 9 * * *");
  const [targetRoutingKey, setTargetRoutingKey] = useState("channels.email.send");
  const [payload, setPayload] = useState("{}");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    apiFetch<ScheduledTask[]>("/v1/schedules")
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  useSSE({
    topics: ["scheduler:*"],
    onEvent: (event, data) => {
      if (event !== "scheduler:task-fired") return;
      const { taskId, firedAt } = data as { taskId: string; firedAt: string };
      apiFetch<ScheduledTask>(`/v1/schedules/${taskId}`)
        .then((fresh) =>
          setTasks((prev) => prev.map((t) => (t.id === taskId ? fresh : t)))
        )
        .catch(() => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? { ...t, fireCount: t.fireCount + 1, lastFiredAt: firedAt }
                : t
            )
          );
        });
    },
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      let parsedPayload: Record<string, unknown> = {};
      try {
        parsedPayload = JSON.parse(payload);
      } catch {
        // use empty object
      }

      const body: Record<string, unknown> = {
        name,
        scheduleType,
        targetRoutingKey,
        payload: parsedPayload,
      };
      if (description) body.description = description;
      if (scheduleType === "CRON") body.cronExpression = cronExpression;

      const created = await apiFetch<ScheduledTask>("/v1/schedules", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setTasks((prev) => [created, ...prev]);
      setShowCreate(false);
      setName("");
      setDescription("");
      setPayload("{}");
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  async function handleAction(
    id: string,
    action: "pause" | "resume" | "trigger" | "delete"
  ) {
    try {
      if (action === "delete") {
        await apiFetch(`/v1/schedules/${id}`, { method: "DELETE" });
        setTasks((prev) => prev.filter((t) => t.id !== id));
      } else {
        const updated = await apiFetch<ScheduledTask>(
          `/v1/schedules/${id}/${action}`,
          { method: "POST" }
        );
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? updated : t))
        );
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tareas programadas</h1>
        <Button onClick={() => setShowCreate(true)}>Nueva tarea</Button>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva tarea programada">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción opcional"
          />
          <Select
            label="Tipo"
            value={scheduleType}
            onChange={(e) => setScheduleType(e.target.value)}
            options={[
              { value: "CRON", label: "Cron — recurrente" },
              { value: "INTERVAL", label: "Intervalo — cada N ms" },
              { value: "ONCE", label: "Una vez — fecha específica" },
            ]}
          />
          {scheduleType === "CRON" && (
            <Input
              label="Expresión cron"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              placeholder="0 9 * * *"
            />
          )}
          {scheduleType === "INTERVAL" && (
            <Input
              label="Intervalo (ms)"
              type="number"
              placeholder="60000 (1 minuto)"
            />
          )}
          {scheduleType === "ONCE" && (
            <Input
              label="Fecha y hora"
              type="datetime-local"
            />
          )}
          <Input
            label="Zona horaria"
            value="America/Bogota"
            placeholder="America/Bogota"
          />
          <Input
            label="Routing key"
            value={targetRoutingKey}
            onChange={(e) => setTargetRoutingKey(e.target.value)}
            placeholder="channels.email.send"
          />
          <p className="text-xs text-gray-500 -mt-2">
            Routing keys útiles: <code>channels.email.send</code>, <code>channels.whatsapp.send</code>, <code>channels.scraping.task</code>
          </p>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Payload (JSON)
            </label>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={4}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder='{"to": ["user@example.com"], "subject": "...", "html": "<p>...</p>"}'
            />
          </div>
          <Button type="submit" loading={creating} className="w-full">
            Crear tarea
          </Button>
        </form>
      </Modal>

      <Card>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon="⏰"
            title="Sin tareas programadas"
            description="Crea una tarea para programar emails, WhatsApp, scraping, etc."
            action={<Button onClick={() => setShowCreate(true)}>Crear primera tarea</Button>}
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="py-4 px-5 hover:bg-gray-50 transition-colors -mx-5 first:-mt-5 last:-mb-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <a
                      href={`/scheduler/${task.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      {task.name}
                    </a>
                    <p className="text-xs text-gray-500">
                      {task.scheduleType}
                      {task.cronExpression && ` · ${task.cronExpression}`}
                      {task.targetRoutingKey &&
                        ` → ${task.targetRoutingKey}`}
                    </p>
                  </div>
                  <Badge status={task.status} />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>
                    Ejecuciones: {task.fireCount} ({task.failureCount} fallos)
                  </span>
                  {task.nextFireAt && (
                    <span>
                      · Próxima: {new Date(task.nextFireAt).toLocaleString()}
                    </span>
                  )}
                  <div className="ml-auto flex gap-1">
                    {task.status === "ACTIVE" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAction(task.id, "pause")}
                      >
                        Pausar
                      </Button>
                    )}
                    {task.status === "PAUSED" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAction(task.id, "resume")}
                      >
                        Reanudar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAction(task.id, "trigger")}
                    >
                      Disparar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAction(task.id, "delete")}
                    >
                      Borrar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

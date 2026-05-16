"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";

type ScheduledTask = {
  id: string;
  name: string;
  description: string | null;
  scheduleType: string;
  cronExpression: string | null;
  intervalMs: number | null;
  runAt: string | null;
  timezone: string;
  targetRoutingKey: string;
  payload: Record<string, unknown>;
  status: string;
  nextFireAt: string | null;
  fireCount: number;
  failureCount: number;
  lastFiredAt: string | null;
  lastStatus: string | null;
  maxLatenessMs: number | null;
  createdAt: string;
  updatedAt: string;
};

type TaskRun = {
  id: string;
  taskId: string;
  scheduledFor: string;
  firedAt: string;
  latencyMs: number;
  status: string;
  publishedTo: string;
  idempotencyKey: string;
  error: string | null;
};

export default function ScheduleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [task, setTask] = useState<ScheduledTask | null>(null);
  const [runs, setRuns] = useState<TaskRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRuns, setShowRuns] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<ScheduledTask>(`/v1/schedules/${id}`),
      apiFetch<TaskRun[]>(`/v1/schedules/${id}/runs?limit=20`).catch(() => []),
    ])
      .then(([t, r]) => {
        setTask(t);
        setRuns(r);
      })
      .catch(() => setTask(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAction(action: "pause" | "resume" | "trigger" | "delete") {
    if (!task) return;
    try {
      if (action === "delete") {
        await apiFetch(`/v1/schedules/${id}`, { method: "DELETE" });
        window.location.href = "/scheduler";
      } else {
        const updated = await apiFetch<ScheduledTask>(`/v1/schedules/${id}/${action}`, {
          method: "POST",
        });
        setTask(updated);
      }
    } catch {
      // ignore
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Cargando...</div>;
  }

  if (!task) {
    return <div className="text-center py-12 text-gray-500">Tarea no encontrada</div>;
  }

  return (
    <div className="max-w-4xl">
      <Link href="/scheduler" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        &larr; Volver a tareas
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{task.name}</h2>
                  <Badge status={task.status} />
                </div>
                {task.description && (
                  <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                {task.status === "ACTIVE" && (
                  <Button size="sm" variant="secondary" onClick={() => handleAction("pause")}>
                    Pausar
                  </Button>
                )}
                {task.status === "PAUSED" && (
                  <Button size="sm" variant="primary" onClick={() => handleAction("resume")}>
                    Reanudar
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => handleAction("trigger")}>
                  Disparar ahora
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleAction("delete")}>
                  Borrar
                </Button>
              </div>
            </div>
          </Card>

          <Card title="Detalles">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Tipo</p>
                <p className="font-medium">{task.scheduleType}</p>
              </div>
              {task.scheduleType === "CRON" && task.cronExpression && (
                <div>
                  <p className="text-gray-500">Expresión cron</p>
                  <p className="font-mono font-medium">{task.cronExpression}</p>
                </div>
              )}
              {task.intervalMs && (
                <div>
                  <p className="text-gray-500">Intervalo</p>
                  <p className="font-medium">{(task.intervalMs / 1000).toFixed(0)}s</p>
                </div>
              )}
              {task.runAt && (
                <div>
                  <p className="text-gray-500">Ejecutar en</p>
                  <p className="font-medium">{new Date(task.runAt).toLocaleString()}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Zona horaria</p>
                <p className="font-medium">{task.timezone}</p>
              </div>
              <div>
                <p className="text-gray-500">Routing key</p>
                <p className="font-mono font-medium text-xs">{task.targetRoutingKey}</p>
              </div>
              {task.maxLatenessMs && (
                <div>
                  <p className="text-gray-500">Max lateness</p>
                  <p className="font-medium">{(task.maxLatenessMs / 60000).toFixed(0)} min</p>
                </div>
              )}
            </div>
          </Card>

          <Card title="Payload">
            <pre className="text-xs bg-gray-50 rounded-lg p-4 overflow-auto max-h-48 font-mono">
              {JSON.stringify(task.payload, null, 2)}
            </pre>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Estadísticas">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Ejecuciones</span>
                <span className="font-medium">{task.fireCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fallos</span>
                <span className="font-medium text-red-600">{task.failureCount}</span>
              </div>
              {task.lastFiredAt && (
                <div>
                  <p className="text-gray-500">Última ejecución</p>
                  <p className="font-medium text-xs">{new Date(task.lastFiredAt).toLocaleString()}</p>
                </div>
              )}
              {task.lastStatus && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Último estado</span>
                  <Badge status={task.lastStatus} />
                </div>
              )}
              {task.nextFireAt && (
                <div>
                  <p className="text-gray-500">Próxima ejecución</p>
                  <p className="font-medium text-xs">{new Date(task.nextFireAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </Card>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setShowRuns(!showRuns)}
          >
            {showRuns ? "Ocultar ejecuciones" : `Ver ejecuciones (${runs.length})`}
          </Button>

          {showRuns && runs.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              Sin ejecuciones registradas
            </p>
          )}

          {showRuns && runs.length > 0 && (
            <div className="space-y-2">
              {runs.map((run) => (
                <div key={run.id} className="rounded-lg border border-gray-200 p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <Badge status={run.status} />
                    <span className="text-xs text-gray-400">
                      {run.latencyMs}ms
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(run.firedAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    → {run.publishedTo}
                  </p>
                  {run.error && (
                    <p className="text-xs text-red-600 mt-1">{run.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

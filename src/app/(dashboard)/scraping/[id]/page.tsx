"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api/client";

type ScrapingTask = {
  id: string;
  url: string;
  strategy: string;
  status: string;
  result: Record<string, unknown> | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  createdAt: string;
};

export default function ScrapingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [task, setTask] = useState<ScrapingTask | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<ScrapingTask>(`/v1/scraping/tasks/${id}`)
      .then(setTask)
      .catch(() => setTask(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Cargando...</div>;
  }

  if (!task) {
    return (
      <div className="text-center py-12 text-gray-500">
        Tarea no encontrada
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link
        href="/scraping"
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        &larr; Volver a scraping
      </Link>

      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold truncate">{task.url}</h2>
            <Badge status={task.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Estrategia</p>
              <p className="font-medium">{task.strategy}</p>
            </div>
            {task.durationMs && (
              <div>
                <p className="text-gray-500">Duración</p>
                <p className="font-medium">
                  {(task.durationMs / 1000).toFixed(2)}s
                </p>
              </div>
            )}
            {task.startedAt && (
              <div>
                <p className="text-gray-500">Iniciado</p>
                <p className="font-medium">
                  {new Date(task.startedAt).toLocaleString()}
                </p>
              </div>
            )}
            {task.completedAt && (
              <div>
                <p className="text-gray-500">Completado</p>
                <p className="font-medium">
                  {new Date(task.completedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {task.result && (
        <Card title="Resultado" className="mt-4">
          <pre className="text-sm bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
            {JSON.stringify(task.result, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}

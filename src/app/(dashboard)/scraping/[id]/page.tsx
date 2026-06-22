"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api/client";

type ScrapingTask = {
  id: string;
  userId: string | null;
  url: string;
  title: string | null;
  status: string;
  notionPageUrl: string | null;
  durationMs: number | null;
  error: string | null;
  occurredAt: string;
};

export default function ScrapingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [task, setTask] = useState<ScrapingTask | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<ScrapingTask>(`/v1/query/scraping-tasks/${id}`)
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
            <h2 className="text-lg font-semibold truncate">{task.title ?? task.url}</h2>
            <Badge status={task.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">URL</p>
              <p className="font-medium truncate">{task.url}</p>
            </div>
            {task.durationMs && (
              <div>
                <p className="text-gray-500">Duración</p>
                <p className="font-medium">{(task.durationMs / 1000).toFixed(2)}s</p>
              </div>
            )}
            {task.notionPageUrl && (
              <div>
                <p className="text-gray-500">Página en Notion</p>
                <a href={task.notionPageUrl} target="_blank" className="font-medium text-blue-600 hover:underline truncate block">
                  {task.notionPageUrl}
                </a>
              </div>
            )}
            {task.error && (
              <div>
                <p className="text-gray-500">Error</p>
                <p className="font-medium text-red-600">{task.error}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500">Ocurrió</p>
              <p className="font-medium">{new Date(task.occurredAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

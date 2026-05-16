"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChannelBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { apiFetch } from "@/lib/api/client";

type UserDetail = {
  user: { id: string; aiEnabled: boolean; createdAt: string };
  identities: { channel: string; channelUserId: string; displayName?: string; trustScore?: number }[];
  contacts: { channel: string; channelUserId: string; displayName?: string }[];
  nameHistory: { name: string; changedAt: string }[];
  reports?: { total: number; spam: number; phishing: number; abuse: number; other: number; lastReportedAt: string | null };
};

export default function IdentityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    apiFetch<UserDetail>(`/v1/identity/users/${id}`)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleAI() {
    if (!detail) return;
    setToggling(true);
    try {
      await apiFetch(`/v1/identity/users/${id}/ai-settings`, {
        method: "PATCH",
        body: JSON.stringify({ aiEnabled: !detail.user.aiEnabled }),
      });
      setDetail({ ...detail, user: { ...detail.user, aiEnabled: !detail.user.aiEnabled } });
    } catch {
      // ignore
    } finally {
      setToggling(false);
    }
  }

  async function handleArchive() {
    if (!detail) return;
    setArchiving(true);
    try {
      await apiFetch(`/v1/identity/users/${id}`, { method: "DELETE" });
      router.push("/identity");
    } catch {
      setArchiving(false);
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando...</div>;
  if (!detail) return <div className="text-center py-12 text-gray-500">Usuario no encontrado</div>;

  const reports = detail.reports;

  return (
    <div className="max-w-5xl">
      <Link href="/identity" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        &larr; Volver a identidades
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Identidad · {detail.user.id.slice(0, 16)}...</h2>
        <Button variant="danger" onClick={() => setShowArchive(true)}>
          Archivar usuario
        </Button>
      </div>

      <Modal open={showArchive} onClose={() => setShowArchive(false)} title="Archivar usuario">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Se archivará (soft-delete) este usuario y todas sus identidades vinculadas. Esta acción se procesa de forma asíncrona en el backend.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowArchive(false)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="danger" loading={archiving} onClick={handleArchive} className="flex-1">
              Confirmar archivo
            </Button>
          </div>
        </div>
      </Modal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card title="Usuario">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">ID</p>
                  <p className="text-sm font-mono text-gray-900">{detail.user.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Creado</p>
                  <p className="text-sm">{new Date(detail.user.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-700">Procesamiento con IA</span>
                  <Button size="sm" variant={detail.user.aiEnabled ? "primary" : "secondary"} loading={toggling} onClick={toggleAI}>
                    {detail.user.aiEnabled ? "Activo" : "Inactivo"}
                  </Button>
                </div>
              </div>
            </Card>

            <Card title="Reportes">
              {reports ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="text-lg font-bold">{reports.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Spam</span>
                    <span className="text-sm font-medium text-red-600">{reports.spam}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Phishing</span>
                    <span className="text-sm font-medium text-red-600">{reports.phishing}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Abuso</span>
                    <span className="text-sm font-medium text-yellow-600">{reports.abuse}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Otros</span>
                    <span className="text-sm font-medium">{reports.other}</span>
                  </div>
                  {reports.lastReportedAt && (
                    <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                      Último reporte: {new Date(reports.lastReportedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Sin reportes</p>
              )}
            </Card>
          </div>

          <Card title="Historial de nombres">
            {detail.nameHistory.length > 0 ? (
              <div className="space-y-2">
                {detail.nameHistory.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-900">{h.name}</span>
                    <span className="text-xs text-gray-400">{new Date(h.changedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sin cambios de nombre</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Identidades">
            <div className="space-y-3">
              {detail.identities.map((ident, i) => (
                <div key={i} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <ChannelBadge channel={ident.channel} />
                  <div>
                    <p className="text-sm font-medium">{ident.displayName ?? ident.channelUserId}</p>
                    <p className="text-xs text-gray-500">{ident.channelUserId}</p>
                  </div>
                  {ident.trustScore !== undefined && (
                    <span className="ml-auto text-xs text-gray-400">confianza: {(ident.trustScore * 100).toFixed(0)}%</span>
                  )}
                </div>
              ))}
              {detail.identities.length === 0 && <p className="text-sm text-gray-500">Sin identidades vinculadas</p>}
            </div>
          </Card>

          {detail.contacts.length > 0 && (
            <Card title="Contactos">
              <div className="space-y-2">
                {detail.contacts.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <ChannelBadge channel={c.channel} />
                    <span>{c.displayName ?? c.channelUserId}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

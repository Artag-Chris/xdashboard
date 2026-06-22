"use client";

import { useEffect, useState } from "react";
import { StatCard, Card } from "@/components/ui/card";
import { Badge, ChannelBadge } from "@/components/ui/badge";
import { useGateway } from "@/lib/microservices/react/context";
import { useIdentityReport } from "@/lib/microservices/react/hooks";
import type { IdentityReport, RecentConversation } from "@/lib/microservices/types";

type DashboardStats = {
  conversations: number;
  messagesSent: number;
  emailsSent: number;
  scrapingJobs: number;
  activeSchedules: number;
  totalUsers: number;
};

export default function DashboardPage() {
  const { api } = useGateway();
  const [stats, setStats] = useState<DashboardStats>({
    conversations: 0, messagesSent: 0, emailsSent: 0,
    scrapingJobs: 0, activeSchedules: 0, totalUsers: 0,
  });
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { report } = useIdentityReport();

  useEffect(() => {
    async function load() {
      try {
        const [convosRes, identityReport] = await Promise.allSettled([
          api.get<{ data: RecentConversation[] }>("/v1/query/conversations?limit=5"),
          api.get<IdentityReport>("/v1/identity/report"),
        ]);
        if (convosRes.status === "fulfilled") {
          const convos = convosRes.value.data ?? [];
          setRecentConversations(convos);
          setStats((s) => ({ ...s, conversations: convos.length }));
        }
        if (identityReport.status === "fulfilled") {
          setStats((s) => ({ ...s, totalUsers: identityReport.value.totalUsers }));
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [api]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard label="Conversaciones" value={loading ? "—" : stats.conversations} />
        <StatCard label="Mensajes enviados" value={loading ? "—" : stats.messagesSent} />
        <StatCard label="Emails" value={loading ? "—" : stats.emailsSent} />
        <StatCard label="Scraping jobs" value={loading ? "—" : stats.scrapingJobs} />
        <StatCard label="Tareas activas" value={loading ? "—" : stats.activeSchedules} />
        <StatCard label="Usuarios" value={loading ? "—" : stats.totalUsers} />
      </div>

      {report && (
        <Card title="Identidades" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">Promedio identidades / usuario</p>
              <p className="text-2xl font-bold">
                {report.averageIdentitiesPerUser.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Usuarios archivados</p>
              <p className="text-2xl font-bold text-gray-400">{report.deletedUsers}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Por canal</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(report.usersByChannel).map(([ch, n]) => (
                  <div key={ch} className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs">
                    <ChannelBadge channel={ch} />
                    <span className="font-medium text-gray-700">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Conversaciones recientes">
          {loading ? (
            <div className="text-sm text-gray-500 py-4">Cargando...</div>
          ) : recentConversations.length === 0 ? (
            <div className="text-sm text-gray-500 py-4 text-center">
              No hay conversaciones recientes
            </div>
          ) : (
            <div className="space-y-3">
              {recentConversations.map((c) => (
                <a
                  key={c.id}
                  href={`/conversations/${c.id}`}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-5 px-5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ChannelBadge channel={c.channel} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.topic ?? "Sin tema"}</p>
                      <p className="text-xs text-gray-500">{c.channelUserId}</p>
                    </div>
                  </div>
                  <Badge status={c.status} />
                </a>
              ))}
            </div>
          )}
        </Card>

        <Card title="Acciones rápidas">
          <div className="grid grid-cols-2 gap-3">
            <QuickAction href="/messages" icon="✉️" label="Enviar mensaje" />
            <QuickAction href="/emails" icon="📧" label="Enviar email" />
            <QuickAction href="/scraping" icon="🕷️" label="Scrapear sitio" />
            <QuickAction href="/scheduler" icon="⏰" label="Programar tarea" />
            <QuickAction href="/agent" icon="🤖" label="Chat con IA" />
            <QuickAction href="/conversations" icon="💬" label="Ver inbox" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 hover:shadow-sm transition-all text-center"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </a>
  );
}

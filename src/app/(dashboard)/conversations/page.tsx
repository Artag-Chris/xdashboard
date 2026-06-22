"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge, ChannelBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useGateway } from "@/lib/microservices/react/context";
import type { UnifiedConversation, Channel } from "@/lib/microservices/types";

const CHANNELS = [
  { value: "", label: "Todos los canales" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "slack", label: "Slack" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "notion", label: "Notion" },
];

const STATUSES = [
  { value: "", label: "Todos los estados" },
  { value: "ACTIVE", label: "Activas" },
  { value: "WITH_AGENT", label: "Con agente" },
  { value: "ARCHIVED", label: "Archivadas" },
  { value: "CLOSED", label: "Cerradas" },
];

export default function ConversationsPage() {
  const { api, conversations } = useGateway();
  const [convos, setConvos] = useState<UnifiedConversation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [refetchTick, setRefetchTick] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [newChannel, setNewChannel] = useState("whatsapp");
  const [newChannelUserId, setNewChannelUserId] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const limit = 20;

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
    if (channel) params.set("channel", channel);
    if (status) params.set("status", status);
    api.get<UnifiedConversation[]>(`/v1/query/conversations?${params}`)
      .then((res) => {
        if (cancelled) return;
        setConvos(res);
        setTotal(res.length);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setConvos([]);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [channel, status, page, refetchTick, api]);

  function refetch() { setLoading(true); setRefetchTick((t) => t + 1); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await conversations.create({
        channel: newChannel as Channel,
        channelUserId: newChannelUserId || undefined,
        topic: newTopic || undefined,
      });
      setShowCreate(false);
      setNewChannelUserId(""); setNewTopic("");
      refetch();
    } catch { /* ignore */ }
  }

  async function archiveConversation(convId: string) {
    try {
      await conversations.archive(convId);
      setConvos((prev) => prev.filter((c) => c.id !== convId));
      setTotal((t) => t - 1);
    } catch { /* ignore */ }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Inbox</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{total} conversaciones</span>
          <Button onClick={() => setShowCreate(true)}>Nueva conversación</Button>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva conversación">
        <form onSubmit={handleCreate} className="space-y-4">
          <Select label="Canal" value={newChannel} onChange={(e) => setNewChannel(e.target.value)} options={CHANNELS.slice(1)} />
          <Input label="ID del usuario en el canal" value={newChannelUserId} onChange={(e) => setNewChannelUserId(e.target.value)} placeholder="573205711428" />
          <Input label="Tema (opcional)" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} placeholder="Soporte, Facturación, etc." />
          <Button type="submit" className="w-full">Crear conversación</Button>
        </form>
      </Modal>

      <Card className="mb-6">
        <div className="flex gap-4">
          <Select value={channel} onChange={(e) => { setLoading(true); setChannel(e.target.value); setPage(0); }} options={CHANNELS} />
          <Select value={status} onChange={(e) => { setLoading(true); setStatus(e.target.value); setPage(0); }} options={STATUSES} />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : convos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay conversaciones con esos filtros</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {convos.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-4 px-5 hover:bg-gray-50 transition-colors -mx-5 first:-mt-5 last:-mb-5 group">
                <a href={`/conversations/${c.id}`} className="flex items-center gap-4 min-w-0 flex-1">
                  <ChannelBadge channel={c.channel} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.topic ?? "Sin tema"}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {c.channelUserId}{c.agentAssigned && ` · Asignado a: ${c.agentAssigned}`}
                    </p>
                  </div>
                </a>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-400">{c.messageCount} msgs</span>
                  {!c.aiEnabled && <span className="text-xs text-yellow-600 font-medium">IA off</span>}
                  <Badge status={c.status} />
                  <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => archiveConversation(c.id)}>Archivar</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {total >= limit && (
          <div className="flex items-center justify-center border-t border-gray-100 pt-4 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setPage((p) => p + 1)}>Cargar más</Button>
          </div>
        )}
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge, ChannelBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGateway } from "@/lib/microservices/react/context";
import type { UnifiedConversation, UnifiedMessage } from "@/lib/microservices/types";

export default function ConversationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { api, conversations } = useGateway();
  const [conv, setConv] = useState<UnifiedConversation | null>(null);
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [convResult, msgsResult] = await Promise.allSettled([
        api.get<UnifiedConversation>(`/v1/query/conversations/${encodeURIComponent(id)}`),
        api.get<UnifiedMessage[]>(`/v1/query/conversations/${encodeURIComponent(id)}/messages`),
      ]);
      if (cancelled) return;
      if (convResult.status === "fulfilled") {
        setConv(convResult.value);
      } else {
        setConv(null);
      }
      if (msgsResult.status === "fulfilled") {
        setMessages(msgsResult.value);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [id, api]);

  async function toggleAI() {
    if (!conv) return;
    try {
      const updated = await conversations.update(id, { aiEnabled: !conv.aiEnabled });
      setConv(updated);
    } catch { /* ignore */ }
  }

  async function archiveConversation() {
    try {
      await conversations.archive(id);
      setConv((prev) => prev ? { ...prev, status: "ARCHIVED" } : prev);
    } catch { /* ignore */ }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando...</div>;
  if (!conv) return <div className="text-center py-12 text-gray-500">Conversación no encontrada</div>;

  return (
    <div className="max-w-3xl">
      <Link href="/conversations" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        &larr; Volver a inbox
      </Link>

      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChannelBadge channel={conv.channel} />
            <div>
              <h2 className="text-lg font-semibold">{conv.topic ?? "Sin tema"}</h2>
              <p className="text-xs text-gray-500 font-mono">{conv.channelUserId} · {conv.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge status={conv.status} />
            <Button size="sm" variant="ghost" onClick={toggleAI}>
              IA: {conv.aiEnabled ? "ON" : "OFF"}
            </Button>
            {conv.status !== "ARCHIVED" && (
              <Button size="sm" variant="ghost" onClick={archiveConversation}>Archivar</Button>
            )}
          </div>
        </div>

        {conv.agentAssigned && (
          <p className="text-sm text-gray-500 mt-3">Asignado a: {conv.agentAssigned}</p>
        )}

        <div className="flex gap-6 mt-4 text-sm text-gray-500">
          <span>{conv.messageCount} mensajes</span>
          <span>{conv.aiMessageCount} IA</span>
          {conv.lastMessageAt && <span>Último: {new Date(conv.lastMessageAt).toLocaleString()}</span>}
        </div>
      </Card>

      <Card title="Mensajes">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Sin mensajes</div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "USER" ? "" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.sender === "USER" ? "bg-gray-100" : msg.sender === "BOT" ? "bg-blue-50" : "bg-green-50"
                }`}>
                  <p className="text-sm text-gray-900">{msg.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(msg.metadata?.senderName as string) ?? (msg.sender === 'BOT' ? 'Asistente' : 'Usuario')} · {new Date(msg.occurredAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

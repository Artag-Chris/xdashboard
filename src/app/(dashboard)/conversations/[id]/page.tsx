"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge, ChannelBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api/client";

type ConversationDetail = {
  id: string;
  channel: string;
  channelUserId: string;
  userId: string | null;
  topic: string | null;
  aiEnabled: boolean;
  agentAssigned: string | null;
  status: string;
  messageCount: number;
  createdAt: string;
  lastMessageAt: string | null;
};

type ConvMessage = {
  id: string;
  direction?: string;
  sender?: string;
  content: string;
  from?: string;
  aiGenerated?: boolean;
  createdAt: string;
};

export default function ConversationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [conv, setConv] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<ConvMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [detail, msgs] = await Promise.all([
          apiFetch<ConversationDetail>(`/v1/conversations/${id}`),
          apiFetch<ConvMessage[]>(`/v1/conversations/${id}/messages`).catch(() => []),
        ]);
        setConv(detail);
        setMessages(msgs);
      } catch {
        setConv(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function updateConv(updates: Record<string, unknown>) {
    try {
      const updated = await apiFetch<ConversationDetail>(`/v1/conversations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      setConv(updated);
    } catch (err) {
      console.error("Error updating conversation:", err);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Cargando...</div>;
  }

  if (!conv) {
    return (
      <div className="text-center py-12 text-gray-500">
        Conversación no encontrada
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <Link
        href="/conversations"
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        &larr; Volver al inbox
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Mensajes" subtitle={`${messages.length} mensajes`}>
            {messages.length === 0 ? (
              <div className="text-sm text-gray-500 py-8 text-center">
                No hay mensajes en esta conversación
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === "INBOUND" || msg.sender === "USER" ? "" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        msg.direction === "INBOUND" || msg.sender === "USER"
                          ? "bg-gray-100"
                          : msg.sender === "BOT"
                            ? "bg-blue-50"
                            : "bg-green-50"
                      }`}
                    >
                      <p className="text-sm text-gray-900">{msg.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {msg.sender ?? msg.direction} ·{" "}
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ChannelBadge channel={conv.channel} />
                <Badge status={conv.status} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Usuario</p>
                <p className="text-sm font-medium">{conv.channelUserId}</p>
              </div>
              {conv.userId && (
                <div>
                  <p className="text-xs text-gray-500">User ID</p>
                  <p className="text-sm font-mono text-gray-600">{conv.userId}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">Tema</p>
                <p className="text-sm font-medium">{conv.topic ?? "General"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mensajes</p>
                <p className="text-sm font-medium">{conv.messageCount}</p>
              </div>
            </div>
          </Card>

          <Card title="Acciones">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">IA activa</span>
                <button
                  onClick={() => updateConv({ aiEnabled: !conv.aiEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    conv.aiEnabled ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      conv.aiEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Estado</p>
                  <select
                    value={conv.status}
                    onChange={(e) => updateConv({ status: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    {["OPEN", "ACTIVE", "WAITING", "WITH_AGENT", "CLOSED", "ARCHIVED"].map(
                      (s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      )
                    )}
                  </select>
                </div>
                {conv.status !== "ARCHIVED" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-5"
                    onClick={() => updateConv({ status: "ARCHIVED" })}
                  >
                    Archivar
                  </Button>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Agente asignado</p>
                <div className="flex gap-2">
                  <Input
                    value={conv.agentAssigned ?? ""}
                    onChange={(e) =>
                      setConv({ ...conv, agentAssigned: e.target.value || null })
                    }
                    placeholder="ID del agente"
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateConv({ agentAssigned: conv.agentAssigned })}
                  >
                    Asignar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

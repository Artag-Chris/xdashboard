"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextArea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { apiFetch } from "@/lib/api/client";
import { useSSE } from "@/lib/sse/use-sse";
import type { SSEEventMap } from "@/lib/sse/types";

type Message = {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
};

type AgentConversation = {
  id: string;
  userId?: string;
  title: string;
  lastMessageAt: string;
  messageCount: number;
  createdAt: string;
};

type AgentMemory = {
  key: string;
  value: string;
  type: string;
  createdAt: string;
};

export default function AgentPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showMemories, setShowMemories] = useState(false);
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [memories, setMemories] = useState<AgentMemory[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    apiFetch<AgentConversation[]>("/v1/agent/conversations")
      .then(setConversations)
      .catch(() => setConversations([]));
  }, []);

  useSSE({
    topics: conversationId ? [`agent:${conversationId}` as const] : [],
    onEvent: (event, data) => {
      if (event === "agent:text-delta") {
        const d = data as SSEEventMap["agent:text-delta"];
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + d.delta },
            ];
          }
          return prev;
        });
      } else if (event === "agent:tool-use-start") {
        const d = data as SSEEventMap["agent:tool-use-start"];
        setMessages((prev) => [
          ...prev,
          {
            id: `tool-${Date.now()}`,
            role: "tool",
            content: `🔧 Usando ${d.toolName}...`,
            toolName: d.toolName,
          },
        ]);
      } else if (event === "agent:tool-use-end") {
        const d = data as SSEEventMap["agent:tool-use-end"];
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "tool" && last.toolName === d.toolName) {
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                content: d.error
                  ? `❌ ${d.toolName}: ${d.error}`
                  : `✅ ${d.toolName} — completado`,
              },
            ];
          }
          return prev;
        });
      } else if (event === "agent:message-completed") {
        setSending(false);
      } else if (event === "agent:error") {
        const d = data as SSEEventMap["agent:error"];
        setMessages((prev) => [
          ...prev,
          { id: `error-${Date.now()}`, role: "assistant", content: `Error: ${d.error}` },
        ]);
        setSending(false);
      }
    },
  });

  async function handleSend() {
    if (!input.trim() || sending) return;

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", content: input },
    ]);
    setInput("");
    setSending(true);

    try {
      await apiFetch(`/v1/agent/chat`, {
        method: "POST",
        body: JSON.stringify({
          message: input,
          conversationId,
          enableStreaming: true,
        }),
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `error-${Date.now()}`, role: "assistant", content: "Error al comunicarse con el agente" },
      ]);
      setSending(false);
    }
  }

  async function loadConversation(convId: string) {
    setConversationId(convId);
    setMessages([]);
    try {
      const conv = await apiFetch<{ messages: { id: string; role: string; content: string }[] }>(
        `/v1/agent/conversations/${convId}`
      );
      setMessages(conv.messages.map((m) => ({ ...m, role: m.role as "user" | "assistant" })));
    } catch {
      setMessages([]);
    }
  }

  async function deleteConversation(convId: string) {
    try {
      await apiFetch(`/v1/agent/conversations/${convId}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (conversationId === convId) {
        setConversationId(null);
        setMessages([]);
      }
    } catch {
      // ignore
    }
  }

  async function loadMemories() {
    setShowMemories(!showMemories);
    if (!showMemories) {
      try {
        const mems = await apiFetch<AgentMemory[]>("/v1/agent/memories");
        setMemories(mems);
      } catch {
        setMemories([]);
      }
    }
  }

  async function deleteMemory(key: string, userId?: string) {
    if (!userId) return;
    try {
      await apiFetch(`/v1/agent/memories/${userId}/${key}`, { method: "DELETE" });
      setMemories((prev) => prev.filter((m) => m.key !== key));
    } catch {
      // ignore
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Agente IA</h1>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? "Ocultar historial" : "Historial"}
          </Button>
          <Button variant="ghost" size="sm" onClick={loadMemories}>
            {showMemories ? "Ocultar memorias" : "Memorias"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="flex flex-col h-[600px]">
            <div className="flex-1 overflow-y-auto space-y-4 px-5 py-4">
              {messages.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <p className="text-3xl mb-3">🤖</p>
                  <p>Envía un mensaje para empezar</p>
                  <p className="text-xs mt-2 text-gray-400">
                    Puede enviar emails, scrapear sitios, mandar mensajes y más
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : msg.role === "tool"
                            ? "bg-yellow-50 text-yellow-800 border border-yellow-200 text-sm"
                            : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-200 p-4 flex gap-3">
              <TextArea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
                rows={1}
                className="flex-1 resize-none"
                disabled={sending}
              />
              <Button onClick={handleSend} loading={sending} disabled={!input.trim()}>
                Enviar
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Herramientas del agente">
            <div className="space-y-2 text-sm">
              {[
                { icon: "📧", label: "email_send / email_get" },
                { icon: "🕷️", label: "scraping_start" },
                { icon: "💬", label: "whatsapp / instagram / slack" },
                { icon: "⏰", label: "scheduler_create" },
                { icon: "🧠", label: "memory_save / memory_recall" },
                { icon: "👤", label: "identity_lookup" },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-2 text-gray-700">
                  <span>{t.icon}</span>
                  <code className="text-xs">{t.label}</code>
                </div>
              ))}
            </div>
          </Card>

          {conversationId && (
            <Card title="Conversación activa">
              <p className="text-xs font-mono text-gray-500 truncate">
                {conversationId}
              </p>
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => {
                setConversationId(null);
                setMessages([]);
              }}>
                Nueva conversación
              </Button>
            </Card>
          )}
        </div>
      </div>

      {showHistory && (
        <Card title="Historial de conversaciones" className="mt-6">
          {conversations.length === 0 ? (
            <EmptyState icon="💬" title="Sin conversaciones" description="Las conversaciones aparecerán aquí" />
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-3 px-5 hover:bg-gray-50 transition-colors -mx-5 first:-mt-5 last:-mb-5">
                  <button
                    onClick={() => { loadConversation(c.id); setShowHistory(false); }}
                    className="text-left flex-1"
                  >
                    <p className="text-sm font-medium text-gray-900">{c.title}</p>
                    <p className="text-xs text-gray-500">
                      {c.messageCount} mensajes · {new Date(c.lastMessageAt).toLocaleDateString()}
                    </p>
                  </button>
                  <Button size="sm" variant="ghost" onClick={() => deleteConversation(c.id)}>
                    Borrar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {showMemories && (
        <Card title="Memorias persistentes" className="mt-6">
          {memories.length === 0 ? (
            <EmptyState icon="🧠" title="Sin memorias" description="El agente guarda recuerdos automáticamente" />
          ) : (
            <div className="divide-y divide-gray-100">
              {memories.map((m) => (
                <div key={m.key} className="flex items-center justify-between py-3 px-5 hover:bg-gray-50 transition-colors -mx-5 first:-mt-5 last:-mb-5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.key}</p>
                    <p className="text-xs text-gray-500">{m.value} · tipo: {m.type}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteMemory(m.key, "user-current")}>
                    Olvidar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

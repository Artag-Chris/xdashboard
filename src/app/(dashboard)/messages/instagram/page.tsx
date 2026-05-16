"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, TextArea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { ChannelBadge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api/client";

type InstagramConversation = {
  conversationId: string;
  igsid: string;
  username: string;
};

type InstagramSendResponse = {
  messageId: string;
  igsid: string;
  status: "SENT";
  timestamp: string;
};

export default function InstagramDMPage() {
  const [convos, setConvos] = useState<InstagramConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSend, setShowSend] = useState(false);
  const [targetIgsid, setTargetIgsid] = useState("");
  const [message, setMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [lastSent, setLastSent] = useState<InstagramSendResponse | null>(null);

  useEffect(() => {
    apiFetch<InstagramConversation[]>("/v1/messages/instagram/conversations")
      .then(setConvos)
      .catch(() => setConvos([]))
      .finally(() => setLoading(false));
  }, []);

  function openSendTo(igsid: string) {
    setTargetIgsid(igsid);
    setMessage("");
    setMediaUrl("");
    setError("");
    setShowSend(true);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const body: Record<string, unknown> = { message };
      if (mediaUrl) body.mediaUrl = mediaUrl;
      const res = await apiFetch<InstagramSendResponse>(
        `/v1/messages/instagram/${encodeURIComponent(targetIgsid)}`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
      setLastSent(res);
      setShowSend(false);
      setMessage("");
      setMediaUrl("");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Error al enviar DM");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Instagram DM</h1>
          <p className="text-sm text-gray-500 mt-1">
            Envío directo por IGSID. Solo respuestas a usuarios que iniciaron la conversación.
          </p>
        </div>
        <Button onClick={() => openSendTo("")}>Nuevo DM</Button>
      </div>

      <Modal
        open={showSend}
        onClose={() => setShowSend(false)}
        title={targetIgsid ? `DM a ${targetIgsid}` : "Nuevo DM"}
      >
        <form onSubmit={handleSend} className="space-y-4">
          {!targetIgsid && (
            <Input
              label="IGSID destino"
              value={targetIgsid}
              onChange={(e) => setTargetIgsid(e.target.value)}
              placeholder="17841472713425441"
              required
            />
          )}
          <TextArea
            label="Mensaje"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            required
          />
          <Input
            label="Media URL (opcional)"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://example.com/imagen.jpg"
          />
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <Button type="submit" loading={sending} className="w-full">
            Enviar DM
          </Button>
        </form>
      </Modal>

      {lastSent && (
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">DM enviado correctamente</p>
              <p className="text-xs text-gray-500 font-mono mt-1">
                {lastSent.messageId} · {new Date(lastSent.timestamp).toLocaleString()}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setLastSent(null)}>
              Cerrar
            </Button>
          </div>
        </Card>
      )}

      <Card title="Conversaciones activas">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : convos.length === 0 ? (
          <EmptyState
            icon="💬"
            title="Sin conversaciones activas"
            description="Las conversaciones aparecerán cuando un usuario te escriba por Instagram."
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {convos.map((c) => (
              <div
                key={c.conversationId}
                className="flex items-center justify-between py-3 px-5 hover:bg-gray-50 transition-colors -mx-5 first:-mt-5 last:-mb-5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ChannelBadge channel="instagram" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      @{c.username}
                    </p>
                    <p className="text-xs text-gray-500 font-mono truncate">
                      IGSID: {c.igsid}
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => openSendTo(c.igsid)}>
                  Enviar DM
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

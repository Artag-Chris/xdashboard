"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, TextArea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SendWhatsappForm } from "@/components/SendWhatsappForm";
import { useSendMessage, type SendMessageRequest, type MessageResponse } from "@/hooks/useSendMessage";
import { useMessageStatus, type MessageStatusUpdate } from "@/hooks/useMessageStatus";

const CHANNELS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "slack", label: "Slack" },
  { value: "facebook", label: "Facebook" },
  { value: "notion", label: "Notion" },
  { value: "tiktok", label: "TikTok" },
];

const FACEBOOK_TAGS = [
  { value: "RESPONSE", label: "Response (default)" },
  { value: "UPDATE", label: "Update" },
  { value: "MESSAGE_TAG", label: "Message Tag (fuera de ventana 24h)" },
];

const TIKTOK_PRIVACY = [
  { value: "PUBLIC_TO_EVERYONE", label: "Público" },
  { value: "MUTUAL_FOLLOW_FRIENDS", label: "Amigos" },
  { value: "SELF_ONLY", label: "Privado" },
];

const recipientHint: Record<string, string> = {
  whatsapp: "573205711428 (código país + número, sin +)",
  instagram: "IGSID (17841472713425441)",
  slack: "C0123456789 (channel ID) o U0123456789 (user ID)",
  facebook: "PSID (123456789012345)",
  notion: "UUID de página/database",
  tiktok: "open_id del creador",
};

type SentMessage = MessageResponse & { channel: string; wsStatus?: MessageStatusUpdate };

export default function MessagesPage() {
  const [channel, setChannel] = useState("whatsapp");
  const [recipients, setRecipients] = useState("");
  const [message, setMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [operation, setOperation] = useState("create_page");
  const [messagingType, setMessagingType] = useState("RESPONSE");
  const [messagingTag, setMessagingTag] = useState("");
  const [tiktokVideoUrl, setTiktokVideoUrl] = useState("");
  const [tiktokPrivacy, setTiktokPrivacy] = useState("PUBLIC_TO_EVERYONE");
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);

  const { state, send } = useSendMessage();
  const lastMessageId = state.phase === "queued" ? state.response.id : null;
  const wsStatus = useMessageStatus(lastMessageId);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const recipientsArr = recipients.split(",").map((r) => r.trim()).filter(Boolean);
    const body: SendMessageRequest = { channel: channel as SendMessageRequest["channel"], recipients: recipientsArr, message };
    if (mediaUrl) body.mediaUrl = mediaUrl;
    if (channel === "notion") body.operation = operation as SendMessageRequest["operation"];
    if (channel === "facebook") {
      body.metadata = { messaging_type: messagingType };
      if (messagingType === "MESSAGE_TAG") (body.metadata as Record<string, string>).tag = messagingTag;
    }
    if (channel === "tiktok") {
      body.metadata = { videoUrl: tiktokVideoUrl, privacy_level: tiktokPrivacy };
    }
    try {
      const res = await send(body);
      setSentMessages((prev) => [{ ...res, channel }, ...prev]);
      setMessage("");
      setMediaUrl("");
      setTiktokVideoUrl("");
    } catch {
      // error manejado por el hook
    }
  }, [channel, recipients, message, mediaUrl, operation, messagingType, messagingTag, tiktokVideoUrl, tiktokPrivacy, send]);

  const handleReset = useCallback(() => {
    setSentMessages((prev) => prev.slice(0, -1));
  }, []);

  function getRecipientFormat(ch: string): string {
    const examples: Record<string, string> = {
      whatsapp: '"573205711428"',
      instagram: '"17841472713425441"',
      slack: '"C0123456789" o "U0123456789"',
      facebook: '"123456789012345"',
      notion: '"abc123..."',
      tiktok: '"open_id_..."',
    };
    return examples[ch] ?? "";
  }

  function channelActionLabel(): string {
    if (channel === "notion") {
      return operation === "create_page" ? "Crear página" : operation === "create_task" ? "Crear tarea" : "Invitar miembro";
    }
    if (channel === "tiktok") return "Publicar video";
    return "Enviar mensaje";
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Enviar mensaje</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card title="Nuevo mensaje">
            <form onSubmit={handleSend} className="space-y-4">
              <Select label="Canal" value={channel} onChange={(e) => setChannel(e.target.value)} options={CHANNELS} />

              {channel === "notion" && (
                <Select label="Operación" value={operation} onChange={(e) => setOperation(e.target.value)}
                  options={[
                    { value: "create_page", label: "Crear página" },
                    { value: "create_task", label: "Crear tarea" },
                    { value: "invite_member", label: "Invitar miembro" },
                  ]}
                />
              )}

              {channel === "facebook" && (
                <>
                  <Select label="Messaging type" value={messagingType} onChange={(e) => setMessagingType(e.target.value)} options={FACEBOOK_TAGS} />
                  {messagingType === "MESSAGE_TAG" && (
                    <Select label="Tag" value={messagingTag} onChange={(e) => setMessagingTag(e.target.value)}
                      options={[
                        { value: "CONFIRMED_EVENT_UPDATE", label: "Confirmed Event Update" },
                        { value: "POST_PURCHASE_UPDATE", label: "Post Purchase Update" },
                        { value: "ACCOUNT_UPDATE", label: "Account Update" },
                      ]}
                    />
                  )}
                </>
              )}

              {channel === "tiktok" && (
                <>
                  <Input label="URL del video (MP4)" value={tiktokVideoUrl} onChange={(e) => setTiktokVideoUrl(e.target.value)} placeholder="https://example.com/video.mp4" />
                  <Select label="Privacidad" value={tiktokPrivacy} onChange={(e) => setTiktokPrivacy(e.target.value)} options={TIKTOK_PRIVACY} />
                </>
              )}

              <Input label="Destinatarios" value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder={recipientHint[channel]} />
              <p className="text-xs text-gray-400 -mt-3">Formato: {getRecipientFormat(channel)}. Múltiples separados por coma.</p>

              <TextArea label="Mensaje" value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
                placeholder={channel === "notion" ? "Título / contenido" : "Texto del mensaje..."} />

              {channel !== "tiktok" && (
                <Input label="Media URL (opcional)" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://example.com/imagen.jpg" />
              )}

              {state.phase === "error" && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">Error: {state.error}</p>
              )}
              {state.phase === "queued" && (
                <div className="text-sm bg-blue-50 rounded-lg px-3 py-2 space-y-1">
                  <p className="text-blue-800">Encolado · ID: <code className="font-mono">{state.response.id}</code></p>
                  <p>
                    Status:{" "}
                    {wsStatus
                      ? `${wsStatus.status} (sent=${wsStatus.sentCount}, failed=${wsStatus.failedCount})`
                      : "esperando confirmación..."}
                  </p>
                  {wsStatus?.errors?.length ? (
                    <ul className="list-disc list-inside text-red-600">
                      {wsStatus.errors.map((e, i) => (
                        <li key={i}>{e.recipient}: {e.reason}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )}

              <Button type="submit" loading={state.phase === "sending"} className="w-full">
                {channelActionLabel()}
              </Button>
            </form>
          </Card>

          {sentMessages.length > 0 && (
            <Card title="Últimos envíos">
              <div className="divide-y divide-gray-100">
                {sentMessages.map((m) => (
                  <SentMessageRow key={m.id} message={m} />
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <SendWhatsappForm />

          <Card title="Guía por canal">
            <div className="space-y-3 text-sm">
              <ChannelGuide channel="WhatsApp" desc="Número con código de país sin +" example="573205711428" extra="Ventana 24h, multi-recipient, media URL" />
              <ChannelGuide channel="Instagram" desc="IGSID numérico" example="17841472713425441" extra="Solo responder DMs iniciados por usuario" />
              <ChannelGuide channel="Slack" desc="Channel ID (C...) o User ID (U...)" example="C0123456789" extra="Bot debe estar invitado al canal" />
              <ChannelGuide channel="Facebook" desc="PSID (Page-Scoped User ID)" example="123456789012345" extra="messaging_type controla ventana 24h" />
              <ChannelGuide channel="Notion" desc="UUID de página o database" example="abc123..." extra="Operaciones: page, task, invite" />
              <ChannelGuide channel="TikTok" desc="open_id del creator" example="open_id_..." extra="Video MP4 vía metadata.videoUrl" />
            </div>
          </Card>

          <Card title="Sobre los IDs">
            <div className="space-y-3 text-sm text-gray-600">
              <p><span className="font-medium text-gray-900">WhatsApp:</span> número completo con código de país, sin +, sin espacios</p>
              <p><span className="font-medium text-gray-900">Instagram:</span> IGSID — único por app, lo obtenés del webhook o del endpoint de conversaciones</p>
              <p><span className="font-medium text-gray-900">Facebook:</span> PSID — único por Page, lo obtenés cuando el usuario te escribe</p>
              <p><span className="font-medium text-gray-900">Slack:</span> IDs con prefijo: C=canal público, U=usuario, G=grupo privado</p>
              <p><span className="font-medium text-gray-900">Notion:</span> UUIDs de 32 caracteres hex, con o sin guiones</p>
              <p><span className="font-medium text-gray-900">TikTok:</span> open_id del creator account autorizado</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SentMessageRow({ message }: { message: SentMessage }) {
  const liveStatus = useMessageStatus(message.id);

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-xs font-mono text-gray-600">{message.id}</p>
        <p className="text-xs text-gray-400">{message.channel} · {new Date(message.createdAt).toLocaleTimeString()}</p>
      </div>
      <Badge status={liveStatus?.status ?? message.status} />
    </div>
  );
}

function ChannelGuide({ channel, desc, example, extra }: { channel: string; desc: string; example: string; extra: string }) {
  return (
    <div className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
      <p className="font-medium text-gray-900">{channel}</p>
      <p className="text-gray-500">{desc}</p>
      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{example}</code>
      <p className="text-xs text-gray-400 mt-0.5">{extra}</p>
    </div>
  );
}

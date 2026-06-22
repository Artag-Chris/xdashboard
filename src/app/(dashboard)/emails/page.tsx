"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, TextArea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useGateway } from "@/lib/microservices/react/context";
import { useSSE } from "@/lib/sse/use-sse";
import type { SSEEventMap } from "@/lib/sse/types";
import type { UnifiedEmail } from "@/lib/microservices/types";

export default function EmailsPage() {
  const { api, email } = useGateway();
  const [tab, setTab] = useState<"send" | "sent" | "inbound">("send");
  const [emails, setEmails] = useState<UnifiedEmail[]>([]);
  const [inbound, setInbound] = useState<UnifiedEmail[]>([]);
  const [loading, setLoading] = useState(false);

  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [from, setFrom] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ id: string; accepted: boolean; status: string } | null>(null);

  useSSE({
    topics: ["email:*"],
    onEvent: (event, data) => {
      if (event === "email:inbound") {
        const d = data as SSEEventMap["email:inbound"];
        const emailMsg: UnifiedEmail = {
          id: d.id, direction: "inbound", domain: d.domain ?? null,
          fromAddress: d.fromAddress, fromName: d.fromName ?? null, toAddresses: d.toAddress ? [d.toAddress] : [],
          subject: d.subject, status: "", textBody: d.textBody ?? null,
          provider: null, providerMessageId: null, toAlias: d.toAlias ?? null,
          replyTo: null, htmlBody: d.htmlBody ?? null,
          sentAt: null, deliveredAt: null, bouncedAt: null,
          complainedAt: null, openedAt: null, clickedAt: null,
          errorReason: null, userId: null,
          attachments: null, metadata: null,
          occurredAt: new Date().toISOString(),
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        setInbound((prev) => [emailMsg, ...prev]);
      } else if (["email.sent", "email.delivered", "email.bounced"].includes(event)) {
        const d = data as SSEEventMap["email.sent"];
        setEmails((prev) =>
          prev.map((e) => e.id === d.emailId ? { ...e, status: event.replace("email.", "").toUpperCase() } : e)
        );
      }
    },
  });

  useEffect(() => {
    let cancelled = false;
    if (tab === "sent") {
      api.get<UnifiedEmail[]>("/v1/query/emails?limit=20&direction=outbound")
        .then((data) => { if (!cancelled) setEmails(data); setLoading(false); })
        .catch(() => { if (!cancelled) setEmails([]); setLoading(false); });
    } else if (tab === "inbound") {
      api.get<UnifiedEmail[]>("/v1/query/emails?limit=20&direction=inbound")
        .then((data) => { if (!cancelled) setInbound(data); setLoading(false); })
        .catch(() => { if (!cancelled) setInbound([]); setLoading(false); });
    }
    return () => { cancelled = true; };
  }, [tab, api]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    setResult(null);

    try {
      const res = await email.send({
        to: to.split(",").map((r) => r.trim()).filter(Boolean),
        subject,
        ...(html && { html }),
        ...(text && { text }),
        ...(cc && { cc: cc.split(",").map((r) => r.trim()).filter(Boolean) }),
        ...(bcc && { bcc: bcc.split(",").map((r) => r.trim()).filter(Boolean) }),
        ...(from && { from }),
        ...(replyTo && { replyTo }),
        ...(idempotencyKey && { idempotencyKey }),
      });
      setResult(res);
      setTo(""); setSubject(""); setHtml(""); setText("");
      setCc(""); setBcc(""); setFrom(""); setReplyTo(""); setIdempotencyKey("");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Error al enviar email");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Emails</h1>
        <div className="flex gap-1">
          {([["send", "Enviar"], ["sent", "Enviados"], ["inbound", "Recibidos"]] as const).map(([key, label]) => (
            <Button key={key} variant={tab === key ? "primary" : "ghost"} size="sm" onClick={() => { if (key !== "send" && key !== tab) setLoading(true); setTab(key); }}>
              {label}
            </Button>
          ))}
        </div>
      </div>

      {tab === "send" && (
        <Card title="Enviar email">
          <form onSubmit={handleSend} className="space-y-4">
            <Input label="Para *" value={to} onChange={(e) => setTo(e.target.value)} placeholder="user@example.com" />
            <p className="text-xs text-gray-400 -mt-3">Múltiples separados por coma</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="CC" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="cc@example.com" />
              <Input label="BCC" value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="bcc@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="From (opcional)" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Soporte <soporte@domain.com>" />
              <Input label="Reply-To (opcional)" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="reply@domain.com" />
            </div>
            <Input label="Asunto *" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Asunto del email" />
            <TextArea label="HTML" value={html} onChange={(e) => setHtml(e.target.value)} rows={6} placeholder="<h1>Hola!</h1><p>...</p>" />
            <TextArea label="Texto plano (fallback)" value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Versión texto plano..." />
            <Input label="Idempotency Key (opcional)" value={idempotencyKey} onChange={(e) => setIdempotencyKey(e.target.value)} placeholder="welcome-user-123" />
            <p className="text-xs text-gray-400 -mt-3">Si reenvías la misma key, no se duplica el envío</p>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            {result && <div className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">Email enviado · ID: {result.id} · Estado: {result.status}</div>}
            <Button type="submit" loading={sending} className="w-full">Enviar email</Button>
          </form>
        </Card>
      )}

      {(tab === "sent" || tab === "inbound") && (
        <Card title={tab === "sent" ? "Emails enviados" : "Bandeja de entrada"}>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Cargando...</div>
          ) : tab === "sent" && emails.length === 0 ? (
            <EmptyState icon="📧" title="Sin emails" description="Los emails enviados aparecerán aquí" />
          ) : tab === "inbound" && inbound.length === 0 ? (
            <EmptyState icon="📥" title="Sin emails recibidos" description="Los emails entrantes aparecen aquí en tiempo real vía SSE" />
          ) : (
            <div className="divide-y divide-gray-100">
              {(tab === "sent" ? emails : inbound).map((email) => (
                <a key={email.id} href={`/emails/${email.id}`} className="flex items-center justify-between py-3 px-5 hover:bg-gray-50 transition-colors -mx-5 first:-mt-5 last:-mb-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{email.subject}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {email.direction === "inbound" ? `De: ${email.fromAddress}` : `Para: ${email.toAddresses.join(", ")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {email.status && <Badge status={email.status} />}
                    <span className="text-xs text-gray-400">{new Date(email.occurredAt).toLocaleDateString()}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

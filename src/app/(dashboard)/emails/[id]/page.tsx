"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api/client";

type EmailDetail = {
  id: string;
  direction: string;
  domain: string;
  subject: string;
  status: string;
  toAddresses: string[];
  toAlias?: string;
  fromAddress: string;
  fromName?: string;
  provider?: string;
  providerMessageId?: string;
  textBody?: string;
  htmlBody?: string;
  headers?: Record<string, string>;
  attachments?: { name: string; contentType: string; size: number }[];
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  userId: string | null;
  occurredAt: string;
};

export default function EmailDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [email, setEmail] = useState<EmailDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<EmailDetail>(`/v1/query/emails/${id}`)
      .then(setEmail)
      .catch(() => setEmail(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando...</div>;
  if (!email) return <div className="text-center py-12 text-gray-500">Email no encontrado</div>;

  return (
    <div className="max-w-3xl">
      <Link href="/emails" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        &larr; Volver a emails
      </Link>

      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{email.subject}</h2>
            <div className="flex gap-2">
              <Badge status={email.status} />
              {email.direction && (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                  {email.direction}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">{email.direction === "inbound" ? "De" : "Para"}</p>
              <p className="font-medium">
                {email.direction === "inbound"
                  ? email.fromName
                    ? `${email.fromName} <${email.fromAddress}>`
                    : email.fromAddress
                  : email.toAddresses.join(", ")}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Asunto</p>
              <p className="font-medium">{email.subject}</p>
            </div>
            {email.provider && (
              <div>
                <p className="text-gray-500">Provider</p>
                <p className="font-medium">{email.provider}</p>
              </div>
            )}
            {email.providerMessageId && (
              <div>
                <p className="text-gray-500">ID del provider</p>
                <p className="font-mono text-xs">{email.providerMessageId}</p>
              </div>
            )}
            {email.domain && (
              <div>
                <p className="text-gray-500">Dominio</p>
                <p className="font-medium">{email.domain}</p>
              </div>
            )}
            {email.sentAt && (
              <div>
                <p className="text-gray-500">Enviado</p>
                <p className="font-medium">{new Date(email.sentAt).toLocaleString()}</p>
              </div>
            )}
            {email.deliveredAt && (
              <div>
                <p className="text-gray-500">Entregado</p>
                <p className="font-medium">{new Date(email.deliveredAt).toLocaleString()}</p>
              </div>
            )}
            {email.openedAt && (
              <div>
                <p className="text-gray-500">Abierto</p>
                <p className="font-medium">{new Date(email.openedAt).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {email.attachments && email.attachments.length > 0 && (
        <Card title="Adjuntos" className="mt-4">
          {email.attachments.map((att, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-2">
              <span>{att.name}</span>
              <span className="text-xs text-gray-500">
                {att.contentType} · {(att.size / 1024).toFixed(1)} KB
              </span>
            </div>
          ))}
        </Card>
      )}

      {email.textBody && (
        <Card title="Contenido texto" className="mt-4">
          <pre className="text-sm whitespace-pre-wrap text-gray-700">{email.textBody}</pre>
        </Card>
      )}
      {email.htmlBody && (
        <Card title="Contenido HTML" className="mt-4">
          <pre className="text-xs bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">{email.htmlBody}</pre>
        </Card>
      )}
      {email.headers && (
        <Card title="Headers" className="mt-4">
          <pre className="text-xs bg-gray-50 rounded-lg p-4 overflow-auto max-h-48">
            {JSON.stringify(email.headers, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}

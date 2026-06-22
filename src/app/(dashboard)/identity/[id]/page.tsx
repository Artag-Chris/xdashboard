"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge, ChannelBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGateway } from "@/lib/microservices/react/context";
import type { UnifiedUser } from "@/lib/microservices/types";

export default function IdentityDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { api, identity } = useGateway();
  const [data, setData] = useState<UnifiedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(false);

  useEffect(() => {
    api.get<UnifiedUser>(`/v1/query/users/${encodeURIComponent(id)}`)
      .then((user) => { setData(user); setAiEnabled(false); })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id, api]);

  async function toggleAI() {
    const newVal = !aiEnabled;
    setAiEnabled(newVal);
    try {
      await identity.updateAISettings(id, { aiEnabled: newVal });
    } catch {
      setAiEnabled(!newVal);
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando...</div>;
  if (!data) return <div className="text-center py-12 text-gray-500">Usuario no encontrado</div>;

  return (
    <div className="max-w-3xl">
      <Link href="/identity" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        &larr; Volver a identidades
      </Link>

      <Card>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{data.displayName ?? data.id}</h2>
              <p className="text-sm text-gray-500 font-mono">{data.id}</p>
            </div>
            <Button size="sm" onClick={toggleAI}>
              IA: {aiEnabled ? "ON" : "OFF"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Real name</p>
              <p className="font-medium">{data.realName ?? "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Avatar</p>
              <p className="font-medium">{data.avatarUrl ? "✓" : "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Conversaciones</p>
              <p className="font-medium">{data.conversationCount}</p>
            </div>
            <div>
              <p className="text-gray-500">Mensajes</p>
              <p className="font-medium">{data.messageCount}</p>
            </div>
            {data.lastSeenAt && (
              <div>
                <p className="text-gray-500">Última vez</p>
                <p className="font-medium">{new Date(data.lastSeenAt).toLocaleString()}</p>
              </div>
            )}
            {data.firstSeenAt && (
              <div>
                <p className="text-gray-500">Primera vez</p>
                <p className="font-medium">{new Date(data.firstSeenAt).toLocaleString()}</p>
              </div>
            )}
            {data.deletedAt && (
              <div className="col-span-2">
                <Badge status="DELETED" />
                <span className="text-xs text-gray-500 ml-2">
                  Archivado el {new Date(data.deletedAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {data.mergedInto && (
              <div className="col-span-2">
                <span className="text-xs text-gray-500">Fusionado en: </span>
                <Link href={`/identity/${data.mergedInto}`} className="text-xs text-blue-600 hover:underline font-mono">
                  {data.mergedInto}
                </Link>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-3">Identidades vinculadas</p>
            <div className="space-y-2">
              {data.identities.map((ident) => (
                <div key={`${ident.channel}-${ident.channelUserId}`} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <ChannelBadge channel={ident.channel} />
                  <div>
                    <p className="text-sm font-medium">{ident.displayName ?? ident.channelUserId}</p>
                    <p className="text-xs text-gray-500">{ident.channelUserId} · Vinculado {new Date(ident.linkedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {data.identities.length === 0 && (
                <p className="text-sm text-gray-400">Sin identidades vinculadas</p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

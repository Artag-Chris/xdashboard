"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ChannelBadge } from "@/components/ui/badge";
import { useGateway } from "@/lib/microservices/react/context";
import type { UnifiedUser } from "@/lib/microservices/types";

export default function IdentityPage() {
  const { api, identity } = useGateway();
  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState("");
  const [showMerge, setShowMerge] = useState(false);
  const [primaryId, setPrimaryId] = useState("");
  const [secondaryId, setSecondaryId] = useState("");
  const [mergeReason, setMergeReason] = useState("");
  const [merging, setMerging] = useState(false);

  const [showResolve, setShowResolve] = useState(false);
  const [resolveChannel, setResolveChannel] = useState("whatsapp");
  const [resolveChannelUserId, setResolveChannelUserId] = useState("");
  const [resolveDisplayName, setResolveDisplayName] = useState("");
  const [resolvePhone, setResolvePhone] = useState("");
  const [resolveEmail, setResolveEmail] = useState("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    const params = channel ? `?channel=${channel}` : "";
    api.get<UnifiedUser[]>(`/v1/query/users${params}`)
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [channel, api]);

  async function handleMerge(e: React.FormEvent) {
    e.preventDefault();
    setMerging(true);
    try {
      await identity.merge({ primaryUserId: primaryId, secondaryUserId: secondaryId, reason: mergeReason });
      setShowMerge(false);
      setPrimaryId(""); setSecondaryId(""); setMergeReason("");
    } catch {
    } finally {
      setMerging(false);
    }
  }

  async function handleResolve(e: React.FormEvent) {
    e.preventDefault();
    setResolving(true);
    try {
      await identity.resolve({
        channel: resolveChannel,
        channelUserId: resolveChannelUserId,
        ...(resolveDisplayName && { displayName: resolveDisplayName }),
        ...(resolvePhone && { phone: resolvePhone }),
        ...(resolveEmail && { email: resolveEmail }),
      });
      setShowResolve(false);
      setResolveChannelUserId(""); setResolveDisplayName(""); setResolvePhone(""); setResolveEmail("");
    } catch {
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Identidades</h1>
        <div className="flex gap-2">
          <Select value={channel} onChange={(e) => setChannel(e.target.value)}
            options={[
              { value: "", label: "Todos los canales" },
              { value: "whatsapp", label: "WhatsApp" },
              { value: "instagram", label: "Instagram" },
              { value: "slack", label: "Slack" },
              { value: "facebook", label: "Facebook" },
              { value: "notion", label: "Notion" },
              { value: "tiktok", label: "TikTok" },
            ]}
          />
          <Button variant="secondary" onClick={() => setShowResolve(true)}>Vincular identidad</Button>
          <Button variant="secondary" onClick={() => setShowMerge(true)}>Fusionar usuarios</Button>
        </div>
      </div>

      <Modal open={showResolve} onClose={() => setShowResolve(false)} title="Vincular identidad">
        <form onSubmit={handleResolve} className="space-y-4">
          <p className="text-sm text-gray-600">
            Crea o vincula una identidad nueva. El backend decide si crea un usuario
            nuevo o vincula a uno existente según los datos.
          </p>
          <Select label="Canal" value={resolveChannel} onChange={(e) => setResolveChannel(e.target.value)}
            options={[
              { value: "whatsapp", label: "WhatsApp" },
              { value: "instagram", label: "Instagram" },
              { value: "slack", label: "Slack" },
              { value: "facebook", label: "Facebook" },
              { value: "notion", label: "Notion" },
              { value: "tiktok", label: "TikTok" },
            ]}
          />
          <Input label="ID del usuario en el canal" value={resolveChannelUserId} onChange={(e) => setResolveChannelUserId(e.target.value)} placeholder="573205711428 / IGSID / PSID / …" required />
          <Input label="Nombre visible (opcional)" value={resolveDisplayName} onChange={(e) => setResolveDisplayName(e.target.value)} />
          <Input label="Teléfono (opcional)" value={resolvePhone} onChange={(e) => setResolvePhone(e.target.value)} placeholder="+57…" />
          <Input label="Email (opcional)" type="email" value={resolveEmail} onChange={(e) => setResolveEmail(e.target.value)} />
          <Button type="submit" loading={resolving} className="w-full">Vincular identidad</Button>
        </form>
      </Modal>

      <Modal open={showMerge} onClose={() => setShowMerge(false)} title="Fusionar usuarios">
        <form onSubmit={handleMerge} className="space-y-4">
          <Input label="Usuario primario (se queda)" value={primaryId} onChange={(e) => setPrimaryId(e.target.value)} placeholder="uuid" required />
          <Input label="Usuario secundario (se elimina)" value={secondaryId} onChange={(e) => setSecondaryId(e.target.value)} placeholder="uuid" required />
          <Input label="Motivo" value={mergeReason} onChange={(e) => setMergeReason(e.target.value)} placeholder="Mismo usuario detectado por..." required />
          <Button type="submit" loading={merging} variant="danger" className="w-full">Fusionar</Button>
        </form>
      </Modal>

      <Card>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay usuarios {channel ? `en ${channel}` : ""}</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((user) => (
              <a key={user.id} href={`/identity/${user.id}`} className="block py-4 px-5 hover:bg-gray-50 transition-colors -mx-5 first:-mt-5 last:-mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-mono font-medium text-gray-900">{user.id}</p>
                  {user.displayName && <span className="text-sm text-gray-500 truncate ml-2">{user.displayName}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.identities.map((ident) => (
                    <div key={`${ident.channel}-${ident.channelUserId}`} className="flex items-center gap-2 text-xs">
                      <ChannelBadge channel={ident.channel} />
                      <span className="text-gray-600">{ident.displayName ?? ident.channelUserId}</span>
                    </div>
                  ))}
                </div>
              </a>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

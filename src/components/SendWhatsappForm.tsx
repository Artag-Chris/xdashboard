"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, TextArea } from "@/components/ui/input";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useMessageStatus } from "@/hooks/useMessageStatus";

export function SendWhatsappForm() {
  const [phone, setPhone] = useState("573205711428");
  const [text, setText] = useState("");

  const { state, send, reset } = useSendMessage();
  const messageId = state.phase === "queued" ? state.response.id : null;
  const wsStatus = useMessageStatus(messageId);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await send({ channel: "whatsapp", recipients: [phone], message: text }).catch(() => {});
  };

  return (
    <Card title="WhatsApp" subtitle="Formulario de ejemplo">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="573205711428" />
        <TextArea label="Mensaje" value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Escribí tu mensaje..." />

        <div className="flex gap-2">
          <Button type="submit" loading={state.phase === "sending"} disabled={state.phase === "sending"}>
            {state.phase === "sending" ? "Enviando..." : "Enviar"}
          </Button>
          {state.phase !== "idle" && (
            <Button type="button" variant="ghost" onClick={reset}>
              Limpiar
            </Button>
          )}
        </div>

        {state.phase === "error" && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">Error: {state.error}</p>
        )}

        {state.phase === "queued" && (
          <div className="text-sm space-y-1 bg-blue-50 rounded-lg px-3 py-2">
            <p className="text-blue-800">
              Encolado con id <code className="font-mono">{state.response.id}</code>
            </p>
            <p>
              Status:{" "}
              {wsStatus
                ? `${wsStatus.status} (sent=${wsStatus.sentCount}, failed=${wsStatus.failedCount})`
                : "esperando confirmación del microservicio..."}
            </p>
            {wsStatus?.errors?.length ? (
              <ul className="list-disc list-inside text-red-600">
                {wsStatus.errors.map((e, i) => (
                  <li key={i}>
                    {e.recipient}: {e.reason}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </form>
    </Card>
  );
}

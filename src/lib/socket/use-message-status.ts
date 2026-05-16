"use client";

import { useEffect, useState } from "react";
import { getSocket } from "./client";

export type MessageStatusUpdate = {
  status: "SENT" | "FAILED" | "PARTIAL";
  sentCount: number;
  failedCount: number;
  errors?: Array<{ recipient: string; reason: string }> | null;
  timestamp: string;
};

/**
 * Suscribe al canal `message:<id>` y devuelve el último status recibido.
 * Devuelve `null` mientras no haya update todavía.
 */
export function useMessageStatus(
  messageId: string | null
): MessageStatusUpdate | null {
  const [status, setStatus] = useState<MessageStatusUpdate | null>(null);

  useEffect(() => {
    if (!messageId) return;
    setStatus(null);

    const socket = getSocket();
    const channel = `message:${messageId}`;
    const onUpdate = (payload: MessageStatusUpdate) => setStatus(payload);

    socket.on(channel, onUpdate);
    return () => {
      socket.off(channel, onUpdate);
    };
  }, [messageId]);

  return status;
}

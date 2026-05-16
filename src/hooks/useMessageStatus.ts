"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";

export type MessageStatusUpdate = {
  status: "SENT" | "FAILED" | "PARTIAL";
  sentCount: number;
  failedCount: number;
  errors?: Array<{ recipient: string; reason: string }> | null;
  timestamp: string;
};

export function useMessageStatus(messageId: string | null): MessageStatusUpdate | null {
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

"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "@/lib/api/client";

type Channel = "whatsapp" | "instagram" | "slack" | "notion" | "tiktok" | "facebook";
type Status = "PENDING" | "SENT" | "FAILED" | "PARTIAL";

export interface SendMessageRequest {
  channel: Channel;
  recipients: string[];
  message: string;
  mediaUrl?: string | null;
  operation?: "create_page" | "create_task" | "invite_member";
  metadata?: Record<string, unknown>;
}

export interface MessageResponse {
  id: string;
  accepted: boolean;
  channel: string;
  recipients: string[];
  message: string;
  status: Status;
  createdAt: string;
}

type State =
  | { phase: "idle" }
  | { phase: "sending" }
  | { phase: "queued"; response: MessageResponse }
  | { phase: "error"; error: string };

export function useSendMessage() {
  const [state, setState] = useState<State>({ phase: "idle" });

  const send = useCallback(async (req: SendMessageRequest) => {
    setState({ phase: "sending" });
    try {
      const response = await apiFetch<MessageResponse>("/v1/messages/send", {
        method: "POST",
        body: JSON.stringify(req),
      });
      setState({ phase: "queued", response });
      return response;
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      setState({ phase: "error", error });
      throw err;
    }
  }, []);

  const reset = useCallback(() => setState({ phase: "idle" }), []);

  return { state, send, reset };
}

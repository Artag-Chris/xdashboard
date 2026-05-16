export type SSETopic =
  | `scraping:${string}`
  | `email:${string}`
  | `scheduler:${string}`
  | `agent:${string}`
  | `scraping:*`
  | `email:*`
  | `agent:*`
  | `*`;

export interface SSEEventMap {
  "scraping:queued": { jobId: string; url: string; userId?: string };
  "scraping:started": { jobId: string; url: string; userId?: string };
  "scraping:completed": {
    jobId: string;
    url: string;
    success: true;
    data: Record<string, unknown>;
    durationMs: number;
  };
  "scraping:failed": {
    jobId: string;
    url: string;
    success: false;
    error: string;
  };
  "email.sent": { emailId: string; providerMessageId: string };
  "email.delivered": { emailId: string; providerMessageId: string };
  "email.bounced": { emailId: string; providerMessageId: string };
  "email.opened": { emailId: string; providerMessageId: string };
  "email.clicked": { emailId: string; providerMessageId: string };
  "email.complained": { emailId: string; providerMessageId: string };
  "email:inbound": {
    id: string;
    domain: string;
    toAddress: string;
    toAlias: string;
    fromAddress: string;
    fromName?: string;
    subject: string;
    textBody?: string;
    htmlBody?: string;
  };
  "scheduler:task-fired": {
    taskId: string;
    executionId: string;
    status: string;
    firedAt: string;
    publishedTo: string;
  };
  "agent:message-started": {
    conversationId: string;
    messageId: string;
    model: string;
  };
  "agent:text-delta": {
    conversationId: string;
    messageId: string;
    delta: string;
  };
  "agent:tool-use-start": {
    conversationId: string;
    toolName: string;
    input: Record<string, unknown>;
  };
  "agent:tool-use-end": {
    conversationId: string;
    toolName: string;
    output: Record<string, unknown>;
    error?: string;
  };
  "agent:message-completed": {
    conversationId: string;
    messageId: string;
    finalText: string;
    usage: { inputTokens: number; outputTokens: number };
  };
  "agent:error": { conversationId: string; error: string };
}

export type SSEEventType = keyof SSEEventMap;

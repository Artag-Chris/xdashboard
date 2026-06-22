import type { IApiClient, IAgentService } from "../core/ports";
import type { ChatDto, ChatResponse, UnifiedConversation, UnifiedMessage } from "../types";

export class AgentService implements IAgentService {
  constructor(private api: IApiClient) {}

  chat(dto: ChatDto): Promise<ChatResponse> {
    return this.api.post("/v1/agent/chat", dto);
  }

  getConversation(id: string): Promise<UnifiedConversation & { messages: UnifiedMessage[] }> {
    return this.api.get(`/v1/agent/conversations/${encodeURIComponent(id)}`);
  }

  deleteConversation(id: string): Promise<{ deleted: boolean }> {
    return this.api.delete(`/v1/agent/conversations/${encodeURIComponent(id)}`);
  }

  listMemories(params: { userId: string; type?: string }): Promise<Array<{ key: string; value: unknown; updatedAt: string }>> {
    return this.api.get("/v1/agent/memories", params as Record<string, string>);
  }

  deleteMemory(userId: string, key: string): Promise<{ deleted: boolean }> {
    return this.api.delete(`/v1/agent/memories/${encodeURIComponent(userId)}/${encodeURIComponent(key)}`);
  }
}

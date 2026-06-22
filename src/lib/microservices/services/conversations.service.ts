import type { IApiClient, IConversationsService } from "../core/ports";
import type { CreateConversationDto, UpdateConversationDto, UnifiedConversation } from "../types";

export class ConversationsService implements IConversationsService {
  constructor(private api: IApiClient) {}

  create(dto: CreateConversationDto): Promise<{ conversationId: string; created: boolean }> {
    return this.api.post("/v1/conversations", dto);
  }

  update(conversationId: string, dto: UpdateConversationDto): Promise<UnifiedConversation> {
    return this.api.patch(`/v1/conversations/${conversationId}`, dto);
  }

  archive(conversationId: string): Promise<{ conversationId: string; archived: boolean }> {
    return this.api.delete(`/v1/conversations/${conversationId}`);
  }
}

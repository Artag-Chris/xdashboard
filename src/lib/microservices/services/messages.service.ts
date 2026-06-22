import type { IApiClient, IMessagesService } from "../core/ports";
import type { SendMessageDto, MessageResponse, InstagramConversation, SendInstagramDto, InstagramSendResult } from "../types";

export class MessagesService implements IMessagesService {
  constructor(private api: IApiClient) {}

  send(dto: SendMessageDto): Promise<MessageResponse> {
    return this.api.post("/v1/messages/send", dto);
  }

  getInstagramConversations(): Promise<InstagramConversation[]> {
    return this.api.get("/v1/messages/instagram/conversations");
  }

  sendToInstagramUser(igsid: string, body: SendInstagramDto): Promise<InstagramSendResult> {
    return this.api.post(`/v1/messages/instagram/${igsid}`, body);
  }

  findOne(id: string): Promise<MessageResponse | null> {
    return this.api.get(`/v1/messages/${id}`);
  }
}

import type { IApiClient, IMessagesService, IEmailService } from "../core/ports";
import type { UnifiedUser, Channel } from "../types";

export interface ContactPersonInput {
  search: string;
  message: string;
  preferredChannel?: Channel;
  mediaUrl?: string;
}

export interface ContactPersonResult {
  found: boolean;
  user?: UnifiedUser;
  availableChannels: Array<{
    channel: string;
    channelUserId: string;
    displayName: string | null;
  }>;
  sent: boolean;
  messageId?: string;
  error?: string;
}

export class ContactPersonWorkflow {
  constructor(
    private api: IApiClient,
    private messages: IMessagesService,
    private email: IEmailService,
  ) {}

  async execute(input: ContactPersonInput): Promise<ContactPersonResult> {
    const searchResults = await this.api.get<{ messages: Array<{ userId?: string }> }>("/v1/query/search", { q: input.search });
    const firstMsg = searchResults.messages?.[0];
    if (!firstMsg?.userId) {
      return { found: false, availableChannels: [], sent: false };
    }

    const user = await this.api.get<UnifiedUser>(`/v1/query/users/${encodeURIComponent(firstMsg.userId)}`);

    const availableChannels = user.identities.map((id) => ({
      channel: id.channel,
      channelUserId: id.channelUserId,
      displayName: id.displayName,
    }));

    if (!input.preferredChannel) {
      return { found: true, user, availableChannels, sent: false };
    }

    const identity = user.identities.find((id) => id.channel === input.preferredChannel);
    if (!identity) {
      return {
        found: true, user, availableChannels, sent: false,
        error: `User has no ${input.preferredChannel} identity`,
      };
    }

    if (input.preferredChannel === "email") {
      const emailResult = await this.email.send({
        to: [identity.channelUserId],
        subject: input.message.slice(0, 100),
        text: input.message,
      });
      return { found: true, user, availableChannels, sent: true, messageId: emailResult.id };
    }

    const msgResult = await this.messages.send({
      channel: input.preferredChannel,
      recipients: [identity.channelUserId],
      message: input.message,
      mediaUrl: input.mediaUrl,
    });

    return { found: true, user, availableChannels, sent: true, messageId: msgResult.id };
  }
}

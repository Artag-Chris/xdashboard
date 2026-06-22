import type { IApiClient, IEmailService } from "../core/ports";
import type { EmailDomain, UnifiedUser } from "../types";

export interface ResolveAndSendEmailInput {
  userIds: string[];
  directEmails?: string[];
  subject: string;
  html?: string;
  text?: string;
  fromDomain?: string;
}

export class ResolveAndSendEmailWorkflow {
  constructor(
    private api: IApiClient,
    private email: IEmailService,
  ) {}

  async execute(input: ResolveAndSendEmailInput): Promise<{
    sent: boolean;
    to: string[];
    fromDomain?: string;
    domains: EmailDomain[];
  }> {
    const domains = await this.email.listDomains();

    const userEmails: string[] = [];
    for (const uid of input.userIds) {
      try {
        const user = await this.api.get<UnifiedUser>(`/v1/query/users/${encodeURIComponent(uid)}`);
        const emailIdentity = user.identities.find(
          (id) => id.channel === "email" || id.channelUserId.includes("@"),
        );
        if (emailIdentity) userEmails.push(emailIdentity.channelUserId);
      } catch {
        // usuario no encontrado, skip
      }
    }

    const allTo = [...userEmails, ...(input.directEmails ?? [])];
    if (allTo.length === 0) {
      return { sent: false, to: [], domains };
    }

    await this.email.send({
      to: allTo,
      subject: input.subject,
      html: input.html,
      text: input.text,
      fromDomain: input.fromDomain,
    });

    return { sent: true, to: allTo, fromDomain: input.fromDomain, domains };
  }
}

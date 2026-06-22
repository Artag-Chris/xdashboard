import type { IApiClient, IEmailService } from "../core/ports";
import type { SendEmailDto, EmailDomain } from "../types";

export class EmailService implements IEmailService {
  constructor(private api: IApiClient) {}

  send(dto: SendEmailDto): Promise<{ id: string; accepted: boolean; status: string }> {
    return this.api.post("/v1/emails", dto);
  }

  listDomains(): Promise<EmailDomain[]> {
    return this.api.get("/v1/emails/domains");
  }

  cleanupInbound(): Promise<{ cleaned: number }> {
    return this.api.post("/v1/emails/inbound/cleanup-expired");
  }
}

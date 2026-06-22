import type { IScrapingService } from "../core/ports";
import type { ScrapingStrategy, OutputConfig } from "../types";

export interface ScrapeAndNotifyInput {
  url: string;
  strategy: ScrapingStrategy;
  userId?: string;
  notify: Array<"notion" | "whatsapp" | "email">;
  notionConfig?: { parentPageId?: string; title?: string };
  whatsappPhone?: string;
  emailConfig?: { to: string[]; subject?: string };
  login?: { usernameSelector: string; passwordSelector: string; submitSelector: string; username: string; password: string; sessionKey?: string; successSelector?: string };
  search?: { query: string; inputSelector: string; submitSelector: string; waitForSelector?: string; waitMs?: number };
}

export interface ScrapeAndNotifyResult {
  requestId: string;
  message: string;
  timestamp: string;
  targets: string[];
}

export class ScrapeAndNotifyWorkflow {
  constructor(private scraping: IScrapingService) {}

  async execute(input: ScrapeAndNotifyInput): Promise<ScrapeAndNotifyResult> {
    const output: OutputConfig = {
      targets: input.notify,
      ...(input.notify.includes("notion") && input.notionConfig
        ? { notion: { parentPageId: input.notionConfig.parentPageId ?? "", title: input.notionConfig.title } }
        : {}),
      ...(input.notify.includes("whatsapp") && input.whatsappPhone
        ? { whatsapp: { to: input.whatsappPhone } }
        : {}),
      ...(input.notify.includes("email") && input.emailConfig
        ? { email: { to: input.emailConfig.to, subject: input.emailConfig.subject } }
        : {}),
    };

    const result = await this.scraping.createTask({
      url: input.url,
      strategy: input.strategy,
      userId: input.userId,
      output: Object.keys(output).length > 0 ? output : undefined,
      ...(input.login && { login: input.login }),
      ...(input.search && { search: input.search }),
    });

    return {
      requestId: result.requestId,
      message: result.message,
      timestamp: result.timestamp,
      targets: input.notify,
    };
  }
}

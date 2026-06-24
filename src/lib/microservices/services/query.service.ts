import type { IApiClient, IQueryService } from "../core/ports";
import type {
  UnifiedUser,
  UnifiedConversation,
  UnifiedMessage,
  UnifiedEmail,
  ScrapingTaskSummary,
  SearchResults,
} from "../types";

export class QueryService implements IQueryService {
  constructor(private api: IApiClient) {}

  listUsers(params?: { limit?: number }): Promise<UnifiedUser[]> {
    return this.api.get("/v1/query/users", params);
  }

  getUser(userId: string): Promise<UnifiedUser> {
    return this.api.get(`/v1/query/users/${encodeURIComponent(userId)}`);
  }

  getUserConversations(userId: string, params?: { channel?: string; limit?: number }): Promise<UnifiedConversation[]> {
    return this.api.get(`/v1/query/users/${encodeURIComponent(userId)}/conversations`, params);
  }

  getUserScrapingTasks(userId: string, params?: { limit?: number }): Promise<ScrapingTaskSummary[]> {
    return this.api.get(`/v1/query/users/${encodeURIComponent(userId)}/scraping-tasks`, params);
  }

  getUserEmails(userId: string, params?: { direction?: string; limit?: number }): Promise<UnifiedEmail[]> {
    return this.api.get(`/v1/query/users/${encodeURIComponent(userId)}/emails`, params);
  }

  listConversations(params?: { channel?: string; status?: string; limit?: number }): Promise<UnifiedConversation[]> {
    return this.api.get("/v1/query/conversations", params);
  }

  getConversation(id: string): Promise<UnifiedConversation> {
    return this.api.get(`/v1/query/conversations/${encodeURIComponent(id)}`);
  }

  getConversationMessages(id: string, params?: { limit?: number }): Promise<UnifiedMessage[]> {
    return this.api.get(`/v1/query/conversations/${encodeURIComponent(id)}/messages`, params);
  }

  listScrapingTasks(params?: { status?: string; limit?: number }): Promise<ScrapingTaskSummary[]> {
    return this.api.get("/v1/query/scraping-tasks", params);
  }

  getScrapingTask(id: string): Promise<ScrapingTaskSummary> {
    return this.api.get(`/v1/query/scraping-tasks/${encodeURIComponent(id)}`);
  }

  listEmails(params?: { direction?: string; domain?: string; status?: string; limit?: number }): Promise<UnifiedEmail[]> {
    return this.api.get("/v1/query/emails", params);
  }

  getEmail(id: string): Promise<UnifiedEmail> {
    return this.api.get(`/v1/query/emails/${encodeURIComponent(id)}`);
  }

  search(params: { q: string; limit?: number }): Promise<SearchResults> {
    return this.api.get("/v1/query/search", params);
  }
}

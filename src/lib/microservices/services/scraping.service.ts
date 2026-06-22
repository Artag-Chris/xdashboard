import type { IApiClient, IScrapingService } from "../core/ports";
import type { CreateScrapingTaskDto, ScrapingTaskResponse, NotifyNotionDto } from "../types";

export class ScrapingService implements IScrapingService {
  constructor(private api: IApiClient) {}

  createTask(dto: CreateScrapingTaskDto): Promise<ScrapingTaskResponse> {
    return this.api.post("/v1/scraping/tasks", dto);
  }

  remove(taskId: string): Promise<{ deleted: boolean }> {
    return this.api.delete(`/v1/scraping/tasks/${taskId}`);
  }

  cleanupExpired(): Promise<{ cleaned: number }> {
    return this.api.post("/v1/scraping/cleanup-expired");
  }

  notifyNotion(dto: NotifyNotionDto): Promise<{ success: boolean }> {
    return this.api.post("/v1/scraping/notify-notion", dto);
  }
}

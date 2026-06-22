import type { IApiClient, ISchedulerService } from "../core/ports";
import type { ScheduledTask, TaskRun, CreateTaskDto, UpdateTaskDto, PaginatedResponse } from "../types";

export class SchedulerService implements ISchedulerService {
  constructor(private api: IApiClient) {}

  list(params?: { limit?: number }): Promise<PaginatedResponse<ScheduledTask>> {
    return this.api.get("/v1/schedules", params);
  }

  get(id: string): Promise<ScheduledTask> {
    return this.api.get(`/v1/schedules/${id}`);
  }

  runs(id: string, params?: { limit?: number }): Promise<TaskRun[]> {
    return this.api.get(`/v1/schedules/${id}/runs`, params);
  }

  create(dto: CreateTaskDto): Promise<ScheduledTask> {
    return this.api.post("/v1/schedules", dto);
  }

  update(id: string, dto: UpdateTaskDto): Promise<ScheduledTask> {
    return this.api.patch(`/v1/schedules/${id}`, dto);
  }

  pause(id: string): Promise<ScheduledTask> {
    return this.api.post(`/v1/schedules/${id}/pause`);
  }

  resume(id: string): Promise<ScheduledTask> {
    return this.api.post(`/v1/schedules/${id}/resume`);
  }

  trigger(id: string): Promise<{ triggered: boolean; taskId: string }> {
    return this.api.post(`/v1/schedules/${id}/trigger`);
  }

  remove(id: string): Promise<{ deleted: boolean }> {
    return this.api.delete(`/v1/schedules/${id}`);
  }
}

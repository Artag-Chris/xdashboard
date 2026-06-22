import type { IApiClient, IIdentityService } from "../core/ports";
import type { ResolveIdentityDto, MergeUsersDto, UpdateAISettingsDto, IdentityReport } from "../types";

export class IdentityService implements IIdentityService {
  constructor(private api: IApiClient) {}

  resolve(dto: ResolveIdentityDto): Promise<{ success: boolean; message: string }> {
    return this.api.post("/v1/identity/resolve", dto);
  }

  getReport(): Promise<IdentityReport> {
    return this.api.get("/v1/identity/report");
  }

  merge(dto: MergeUsersDto): Promise<{ success: boolean; message: string }> {
    return this.api.post("/v1/identity/merge", dto);
  }

  delete(userId: string): Promise<{ success: boolean; message: string }> {
    return this.api.delete(`/v1/identity/users/${userId}`);
  }

  updateAISettings(userId: string, dto: UpdateAISettingsDto): Promise<{ success: boolean; message: string }> {
    return this.api.patch(`/v1/identity/users/${userId}/ai-settings`, dto);
  }
}

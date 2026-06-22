import type {
  UnifiedUser,
  UnifiedConversation,
  UnifiedMessage,
  UnifiedEmail,
  ScrapingTaskSummary,
  ScheduledTask,
  TaskRun,
  PaginatedResponse,
  ResolveIdentityDto,
  MergeUsersDto,
  UpdateAISettingsDto,
  IdentityReport,
  SendEmailDto,
  EmailDomain,
  SendMessageDto,
  MessageResponse,
  CreateScrapingTaskDto,
  ScrapingTaskResponse,
  NotifyNotionDto,
  CreateTaskDto,
  UpdateTaskDto,
  CreateConversationDto,
  UpdateConversationDto,
  ChatDto,
  ChatResponse,
  SearchResults,
  InstagramConversation,
  SendInstagramDto,
  InstagramSendResult,
} from "../types";

export interface IApiClient {
  get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
}

export interface IQueryService {
  listUsers(params?: { limit?: number; cursor?: string }): Promise<PaginatedResponse<UnifiedUser>>;
  getUser(userId: string): Promise<UnifiedUser>;
  getUserConversations(userId: string, params?: { channel?: string; limit?: number; cursor?: string }): Promise<PaginatedResponse<UnifiedConversation>>;
  getUserScrapingTasks(userId: string, params?: { limit?: number; cursor?: string }): Promise<PaginatedResponse<ScrapingTaskSummary>>;
  getUserEmails(userId: string, params?: { direction?: string; limit?: number; cursor?: string }): Promise<PaginatedResponse<UnifiedEmail>>;
  listConversations(params?: { channel?: string; status?: string; limit?: number; cursor?: string }): Promise<PaginatedResponse<UnifiedConversation>>;
  getConversation(id: string): Promise<UnifiedConversation>;
  getConversationMessages(id: string, params?: { limit?: number; cursor?: string }): Promise<PaginatedResponse<UnifiedMessage>>;
  listScrapingTasks(params?: { status?: string; limit?: number; cursor?: string }): Promise<PaginatedResponse<ScrapingTaskSummary>>;
  getScrapingTask(id: string): Promise<ScrapingTaskSummary>;
  listEmails(params?: { direction?: string; domain?: string; status?: string; limit?: number; cursor?: string }): Promise<PaginatedResponse<UnifiedEmail>>;
  getEmail(id: string): Promise<UnifiedEmail>;
  search(params: { q: string; limit?: number }): Promise<SearchResults>;
}

export interface IIdentityService {
  resolve(dto: ResolveIdentityDto): Promise<{ success: boolean; message: string }>;
  getReport(): Promise<IdentityReport>;
  merge(dto: MergeUsersDto): Promise<{ success: boolean; message: string }>;
  delete(userId: string): Promise<{ success: boolean; message: string }>;
  updateAISettings(userId: string, dto: UpdateAISettingsDto): Promise<{ success: boolean; message: string }>;
}

export interface IEmailService {
  send(dto: SendEmailDto): Promise<{ id: string; accepted: boolean; status: string }>;
  listDomains(): Promise<EmailDomain[]>;
  cleanupInbound(): Promise<{ cleaned: number }>;
}

export interface IMessagesService {
  send(dto: SendMessageDto): Promise<MessageResponse>;
  getInstagramConversations(): Promise<InstagramConversation[]>;
  sendToInstagramUser(igsid: string, body: SendInstagramDto): Promise<InstagramSendResult>;
  findOne(id: string): Promise<MessageResponse | null>;
}

export interface IScrapingService {
  createTask(dto: CreateScrapingTaskDto): Promise<ScrapingTaskResponse>;
  remove(taskId: string): Promise<{ deleted: boolean }>;
  cleanupExpired(): Promise<{ cleaned: number }>;
  notifyNotion(dto: NotifyNotionDto): Promise<{ success: boolean }>;
}

export interface ISchedulerService {
  list(params?: { limit?: number }): Promise<PaginatedResponse<ScheduledTask>>;
  get(id: string): Promise<ScheduledTask>;
  runs(id: string, params?: { limit?: number }): Promise<TaskRun[]>;
  create(dto: CreateTaskDto): Promise<ScheduledTask>;
  update(id: string, dto: UpdateTaskDto): Promise<ScheduledTask>;
  pause(id: string): Promise<ScheduledTask>;
  resume(id: string): Promise<ScheduledTask>;
  trigger(id: string): Promise<{ triggered: boolean; taskId: string }>;
  remove(id: string): Promise<{ deleted: boolean }>;
}

export interface IAgentService {
  chat(dto: ChatDto): Promise<ChatResponse>;
  getConversation(id: string): Promise<UnifiedConversation & { messages: UnifiedMessage[] }>;
  deleteConversation(id: string): Promise<{ deleted: boolean }>;
  listMemories(params: { userId: string; type?: string }): Promise<Array<{ key: string; value: unknown; updatedAt: string }>>;
  deleteMemory(userId: string, key: string): Promise<{ deleted: boolean }>;
}

export interface IConversationsService {
  create(dto: CreateConversationDto): Promise<{ conversationId: string; created: boolean }>;
  update(conversationId: string, dto: UpdateConversationDto): Promise<UnifiedConversation>;
  archive(conversationId: string): Promise<{ conversationId: string; archived: boolean }>;
}

export interface IRealtimeAdapter {
  onMessageStatus(messageId: string, cb: (status: unknown) => void): () => void;
  subscribeToSSE<E extends string>(topics: string[], handlers: Record<E, (data: unknown) => void>): () => void;
}

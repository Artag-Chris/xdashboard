// ── Common ──

export type Channel =
  | "whatsapp" | "instagram" | "slack" | "notion"
  | "tiktok" | "facebook" | "email" | "agent";

export type Sender = "USER" | "BOT" | "AGENT" | "SYSTEM";

export type ConvStatus =
  | "ACTIVE" | "WITH_AGENT" | "ARCHIVED" | "CLOSED" | "DELETED";

export type ScheduleType = "CRON" | "INTERVAL" | "ONCE";

export type TaskStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "FAILED";

export type MessageStatusValue = "PENDING" | "SENT" | "FAILED" | "PARTIAL";

export type EmailDirection = "outbound" | "inbound";

export type ScrapingStatus = "completed" | "failed";

export type ScrapingStrategy =
  | "auto" | "extract" | "search"
  | "login_then_extract" | "login_then_search" | "custom_flow";

// ── Read Model (CQRS) ──

export interface UserChannelId {
  channel: string;
  channelUserId: string;
  displayName: string | null;
  linkedAt: string;
}

export interface UnifiedUser {
  id: string;
  displayName: string | null;
  realName: string | null;
  avatarUrl: string | null;
  identities: UserChannelId[];
  conversationCount: number;
  messageCount: number;
  lastSeenAt: string | null;
  firstSeenAt: string | null;
  deletedAt: string | null;
  mergedInto: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedConversation {
  id: string;
  userId: string | null;
  channel: string;
  channelUserId: string;
  topic: string | null;
  status: ConvStatus;
  aiEnabled: boolean;
  agentAssigned: string | null;
  messageCount: number;
  aiMessageCount: number;
  lastMessageAt: string | null;
  firstMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedMessage {
  id: string;
  conversationId: string | null;
  userId: string | null;
  channel: string;
  channelUserId: string;
  sender: Sender;
  content: string;
  mediaUrl: string | null;
  externalId: string | null;
  metadata: Record<string, unknown> | null;
  occurredAt: string;
  createdAt: string;
}

export interface UnifiedEmail {
  id: string;
  direction: EmailDirection;
  domain: string | null;
  fromAddress: string;
  toAddresses: string[];
  toAlias: string | null;
  fromName: string | null;
  replyTo: string | null;
  subject: string | null;
  textBody: string | null;
  htmlBody: string | null;
  provider: string | null;
  providerMessageId: string | null;
  status: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  bouncedAt: string | null;
  complainedAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  errorReason: string | null;
  userId: string | null;
  attachments: Array<{ name?: string; contentType?: string; size?: number }> | null;
  metadata: Record<string, unknown> | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScrapingTaskSummary {
  id: string;
  userId: string | null;
  url: string;
  title: string | null;
  status: ScrapingStatus;
  notionPageUrl: string | null;
  durationMs: number | null;
  error: string | null;
  occurredAt: string;
  createdAt: string;
}

// ── Write DTOs ──

export interface ResolveIdentityDto {
  channel: string;
  channelUserId: string;
  displayName?: string;
  phone?: string;
  email?: string;
  username?: string;
  avatarUrl?: string;
  trustScore?: number;
  metadata?: Record<string, unknown>;
}

export interface MergeUsersDto {
  primaryUserId: string;
  secondaryUserId: string;
  reason: string;
}

export interface UpdateAISettingsDto {
  aiEnabled: boolean;
}

export interface IdentityReport {
  totalUsers: number;
  usersByChannel: Record<string, number>;
  deletedUsers: number;
  averageIdentitiesPerUser: number;
}

export interface SendEmailDto {
  to: string[];
  cc?: string[];
  bcc?: string[];
  from?: string;
  fromDomain?: string;
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface EmailDomain {
  name: string;
  domain: string;
  defaultFrom: string;
}

export interface SendMessageDto {
  channel: Channel;
  recipients: string[];
  message: string;
  operation?: string;
  mediaUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface MessageResponse {
  id: string;
  accepted: boolean;
  channel: string;
  recipients: string[];
  message: string;
  status: MessageStatusValue;
  createdAt: string;
}

export interface InstagramConversation {
  conversationId: string;
  igsid: string;
  username?: string;
}

export interface SendInstagramDto {
  message: string;
  mediaUrl?: string;
}

export interface InstagramSendResult {
  messageId: string;
  igsid: string;
  status: "SENT" | "FAILED";
  timestamp: string;
}

export interface LoginConfig {
  usernameSelector: string;
  passwordSelector: string;
  submitSelector: string;
  username: string;
  password: string;
  sessionKey?: string;
  successSelector?: string;
}

export interface SearchConfig {
  query: string;
  inputSelector: string;
  submitSelector: string;
  waitForSelector?: string;
  waitMs?: number;
}

export interface OutputConfig {
  targets?: Array<"event" | "notion" | "whatsapp" | "email">;
  notion?: { parentPageId: string; title?: string; icon?: string };
  whatsapp?: { to: string };
  email?: { to: string[]; subject?: string };
}

export interface PerformanceConfig {
  blockResources?: boolean;
  cacheTtlMs?: number;
  timeoutMs?: number;
}

export interface LifecycleConfig {
  expiresAfterMs?: number;
  metadata?: Record<string, unknown>;
}

export interface CreateScrapingTaskDto {
  url: string;
  userId?: string;
  strategy: ScrapingStrategy;
  selectors?: Record<string, unknown>;
  search?: SearchConfig;
  login?: LoginConfig;
  flow?: Array<Record<string, unknown>>;
  output?: OutputConfig;
  performance?: PerformanceConfig;
  lifecycle?: LifecycleConfig;
}

export interface ScrapingTaskResponse {
  requestId: string;
  message: string;
  timestamp: string;
}

export interface NotifyNotionDto {
  userId: string;
  title: string;
  url?: string;
  data: Record<string, unknown>;
  notionPageId?: string;
}

export interface CreateTaskDto {
  name: string;
  description?: string;
  scheduleType: ScheduleType;
  cronExpression?: string;
  intervalMs?: number;
  runAt?: string;
  timezone?: string;
  targetExchange?: string;
  targetRoutingKey: string;
  payload: Record<string, unknown>;
  maxRetries?: number;
  retryBackoffMs?: number;
  maxLatenessMs?: number;
  createdBy?: string;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {
  status?: TaskStatus;
}

export interface ScheduledTask {
  id: string;
  name: string;
  description: string | null;
  scheduleType: ScheduleType;
  cronExpression: string | null;
  intervalMs: number | null;
  runAt: string | null;
  timezone: string | null;
  targetExchange: string | null;
  targetRoutingKey: string;
  payload: Record<string, unknown>;
  maxRetries: number;
  retryBackoffMs: number;
  maxLatenessMs: number;
  status: TaskStatus;
  lastFiredAt: string | null;
  lastStatus: string | null;
  fireCount: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskRun {
  id: string;
  taskId: string;
  scheduledFor: string;
  firedAt: string;
  latencyMs: number;
  status: string;
  error: string | null;
  createdAt: string;
}

export interface ChatDto {
  message: string;
  conversationId?: string;
  userId?: string;
  enableStreaming?: boolean;
}

export interface ChatResponse {
  reply: string;
  conversationId: string;
  toolCalls?: Array<{
    tool: string;
    input: Record<string, unknown>;
    output: string;
  }>;
}

export interface CreateConversationDto {
  channel: Channel;
  channelUserId?: string;
  topic?: string;
  aiEnabled?: boolean;
}

export interface UpdateConversationDto {
  aiEnabled?: boolean;
  agentAssigned?: string;
  status?: ConvStatus;
}

export interface SearchResults {
  messages: UnifiedMessage[];
  conversations: UnifiedConversation[];
  emails: UnifiedEmail[];
}

// ── Pagination ──

export interface PaginatedResponse<T> {
  data: T[];
  cursor?: string;
}

// ── Dashboard ──

export interface DashboardStats {
  conversations: number;
  messagesSent: number;
  emailsSent: number;
  scrapingJobs: number;
  activeSchedules: number;
  totalUsers: number;
}

export interface RecentConversation {
  id: string;
  channel: string;
  channelUserId: string;
  topic: string | null;
  status: string;
  lastMessageAt: string | null;
}

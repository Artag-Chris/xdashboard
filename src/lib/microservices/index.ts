// Core
export { ApiError } from "./core/errors";
export type {
  IApiClient,
  IQueryService,
  IIdentityService,
  IEmailService,
  IMessagesService,
  IScrapingService,
  ISchedulerService,
  IAgentService,
  IConversationsService,
} from "./core/ports";

// Adapters
export { ApiClient } from "./adapters/http-adapter";

// Services
export { QueryService } from "./services/query.service";
export { IdentityService } from "./services/identity.service";
export { EmailService } from "./services/email.service";
export { MessagesService } from "./services/messages.service";
export { ScrapingService } from "./services/scraping.service";
export { SchedulerService } from "./services/scheduler.service";
export { AgentService } from "./services/agent.service";
export { ConversationsService } from "./services/conversations.service";
export { registerService, getService, listServices } from "./services/registry";

// Extensions
export { registerSidebarItem, registerPlugin, getSidebarItems, getPlugins } from "./extensions/registry";
export type { SidebarItem, DashboardPlugin } from "./extensions/types";

// React
export { GatewayProvider } from "./react/provider";
export { GatewayContext, useGateway } from "./react/context";
export { useService } from "./react/use-registry";
export {
  useUsers, useUser, useConversations, useConversationMessages,
  useEmails, useScrapingTasks, useSearch,
  useDashboardStats, useIdentityReport,
  useDomains, useSendMessage, useCreateScrapingTask, useChat,
} from "./react/hooks";

// Workflows
export { ContactPersonWorkflow } from "./workflows/contact-person";
export { ScrapeAndNotifyWorkflow } from "./workflows/scrape-and-notify";
export { ResolveAndSendEmailWorkflow } from "./workflows/resolve-and-send-email";
export type { ContactPersonInput, ContactPersonResult } from "./workflows/contact-person";
export type { ScrapeAndNotifyInput, ScrapeAndNotifyResult } from "./workflows/scrape-and-notify";
export type { ResolveAndSendEmailInput } from "./workflows/resolve-and-send-email";

// Registration
export { initializeMicroservices } from "./registration";

// Types
export type * from "./types";

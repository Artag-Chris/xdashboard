import { ApiClient } from "./adapters/http-adapter";
import { registerService } from "./services/registry";
import { registerSidebarItem } from "./extensions/registry";
import { QueryService } from "./services/query.service";
import { IdentityService } from "./services/identity.service";
import { EmailService } from "./services/email.service";
import { MessagesService } from "./services/messages.service";
import { ScrapingService } from "./services/scraping.service";
import { SchedulerService } from "./services/scheduler.service";
import { AgentService } from "./services/agent.service";
import { ConversationsService } from "./services/conversations.service";
import { ContactPersonWorkflow } from "./workflows/contact-person";
import { ScrapeAndNotifyWorkflow } from "./workflows/scrape-and-notify";
import { ResolveAndSendEmailWorkflow } from "./workflows/resolve-and-send-email";

const DEFAULT_SIDEBAR = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/conversations", label: "Inbox", icon: "💬" },
  { href: "/messages", label: "Mensajes", icon: "✉️" },
  { href: "/emails", label: "Emails", icon: "📧" },
  { href: "/scraping", label: "Scraping", icon: "🕷️" },
  { href: "/scheduler", label: "Tareas", icon: "⏰" },
  { href: "/agent", label: "Agente IA", icon: "🤖" },
  { href: "/identity", label: "Identidades", icon: "👤" },
];

let initialized = false;

export function initializeMicroservices(): void {
  if (initialized) return;
  initialized = true;

  const api = new ApiClient();

  const query = new QueryService(api);
  const identity = new IdentityService(api);
  const email = new EmailService(api);
  const messages = new MessagesService(api);
  const scraping = new ScrapingService(api);
  const scheduler = new SchedulerService(api);
  const agent = new AgentService(api);
  const conversations = new ConversationsService(api);

  registerService("api", api);
  registerService("query", query);
  registerService("identity", identity);
  registerService("email", email);
  registerService("messages", messages);
  registerService("scraping", scraping);
  registerService("scheduler", scheduler);
  registerService("agent", agent);
  registerService("conversations", conversations);

  registerService("contactPersonWorkflow", new ContactPersonWorkflow(api, messages, email));
  registerService("scrapeAndNotifyWorkflow", new ScrapeAndNotifyWorkflow(scraping));
  registerService("resolveAndSendEmailWorkflow", new ResolveAndSendEmailWorkflow(api, email));

  DEFAULT_SIDEBAR.forEach(registerSidebarItem);
}

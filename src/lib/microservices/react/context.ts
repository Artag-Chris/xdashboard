"use client";

import { createContext, useContext } from "react";
import type { IApiClient } from "../core/ports";
import type {
  IIdentityService,
  IEmailService,
  IMessagesService,
  IScrapingService,
  ISchedulerService,
  IAgentService,
  IConversationsService,
} from "../core/ports";
import type { ContactPersonWorkflow } from "../workflows/contact-person";
import type { ScrapeAndNotifyWorkflow } from "../workflows/scrape-and-notify";
import type { ResolveAndSendEmailWorkflow } from "../workflows/resolve-and-send-email";

export interface GatewayContextValue {
  api: IApiClient;
  identity: IIdentityService;
  email: IEmailService;
  messages: IMessagesService;
  scraping: IScrapingService;
  scheduler: ISchedulerService;
  agent: IAgentService;
  conversations: IConversationsService;
  workflows: {
    contactPerson: ContactPersonWorkflow;
    scrapeAndNotify: ScrapeAndNotifyWorkflow;
    resolveAndSendEmail: ResolveAndSendEmailWorkflow;
  };
}

export const GatewayContext = createContext<GatewayContextValue | null>(null);

export function useGateway(): GatewayContextValue {
  const ctx = useContext(GatewayContext);
  if (!ctx) {
    throw new Error("useGateway must be used within GatewayProvider");
  }
  return ctx;
}

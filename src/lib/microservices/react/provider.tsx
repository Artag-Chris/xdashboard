"use client";

import { type ReactNode, useState } from "react";
import { GatewayContext, type GatewayContextValue } from "./context";
import { initializeMicroservices } from "../registration";
import { getService } from "../services/registry";
import type {
  IIdentityService,
  IEmailService,
  IMessagesService,
  IScrapingService,
  ISchedulerService,
  IAgentService,
  IConversationsService,
} from "../core/ports";
import type { IApiClient } from "../core/ports";
import type { ContactPersonWorkflow } from "../workflows/contact-person";
import type { ScrapeAndNotifyWorkflow } from "../workflows/scrape-and-notify";
import type { ResolveAndSendEmailWorkflow } from "../workflows/resolve-and-send-email";

function buildContext(): GatewayContextValue {
  initializeMicroservices();
  return {
    api: getService<IApiClient>("api"),
    identity: getService<IIdentityService>("identity"),
    email: getService<IEmailService>("email"),
    messages: getService<IMessagesService>("messages"),
    scraping: getService<IScrapingService>("scraping"),
    scheduler: getService<ISchedulerService>("scheduler"),
    agent: getService<IAgentService>("agent"),
    conversations: getService<IConversationsService>("conversations"),
    workflows: {
      contactPerson: getService<ContactPersonWorkflow>("contactPersonWorkflow"),
      scrapeAndNotify: getService<ScrapeAndNotifyWorkflow>("scrapeAndNotifyWorkflow"),
      resolveAndSendEmail: getService<ResolveAndSendEmailWorkflow>("resolveAndSendEmailWorkflow"),
    },
  };
}

export function GatewayProvider({ children }: { children: ReactNode }) {
  const [value] = useState(buildContext);

  return (
    <GatewayContext.Provider value={value}>
      {children}
    </GatewayContext.Provider>
  );
}

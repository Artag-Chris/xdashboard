import type { SidebarItem, DashboardPlugin } from "./types";

const DEFAULT_SIDEBAR: SidebarItem[] = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/conversations", label: "Inbox", icon: "💬" },
  { href: "/messages", label: "Mensajes", icon: "✉️" },
  { href: "/emails", label: "Emails", icon: "📧" },
  { href: "/scraping", label: "Scraping", icon: "🕷️" },
  { href: "/scheduler", label: "Tareas", icon: "⏰" },
  { href: "/agent", label: "Agente IA", icon: "🤖" },
  { href: "/identity", label: "Identidades", icon: "👤" },
];

const sidebarItems: SidebarItem[] = [];

const plugins = new Map<string, DashboardPlugin>();

// Register defaults immediately — this file is imported at module level by the layout
for (const item of DEFAULT_SIDEBAR) {
  sidebarItems.push(item);
}

export function getSidebarItems(): SidebarItem[] {
  return sidebarItems;
}

export function registerSidebarItem(item: SidebarItem): void {
  const exists = sidebarItems.some((s) => s.href === item.href);
  if (!exists) {
    sidebarItems.push(item);
  }
}

export function registerPlugin(plugin: DashboardPlugin): void {
  if (plugins.has(plugin.name)) return;
  plugins.set(plugin.name, plugin);
  plugin.sidebarItems?.forEach(registerSidebarItem);
}

export function getPlugins(): DashboardPlugin[] {
  return Array.from(plugins.values());
}

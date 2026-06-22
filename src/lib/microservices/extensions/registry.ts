import type { SidebarItem, DashboardPlugin } from "./types";

const sidebarItems: SidebarItem[] = [];
const plugins = new Map<string, DashboardPlugin>();

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

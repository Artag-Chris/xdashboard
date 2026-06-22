export interface SidebarItem {
  href: string;
  label: string;
  icon: string;
}

export interface DashboardPlugin {
  name: string;
  sidebarItems?: SidebarItem[];
}

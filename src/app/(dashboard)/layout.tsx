import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/conversations", label: "Inbox", icon: "💬" },
  { href: "/messages", label: "Mensajes", icon: "✉️" },
  { href: "/emails", label: "Emails", icon: "📧" },
  { href: "/scraping", label: "Scraping", icon: "🕷️" },
  { href: "/scheduler", label: "Tareas", icon: "⏰" },
  { href: "/agent", label: "Agente IA", icon: "🤖" },
  { href: "/identity", label: "Identidades", icon: "👤" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-1">
      <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4 flex flex-col gap-2">
        <div className="text-lg font-bold mb-4 px-3">Dashboard</div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}

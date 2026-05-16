const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  OPEN: "bg-green-100 text-green-800",
  WAITING: "bg-yellow-100 text-yellow-800",
  WAITING_AGENT: "bg-yellow-100 text-yellow-800",
  WITH_AGENT: "bg-blue-100 text-blue-800",
  CLOSED: "bg-gray-100 text-gray-600",
  ARCHIVED: "bg-gray-100 text-gray-400",
  PENDING: "bg-yellow-100 text-yellow-800",
  QUEUED: "bg-yellow-100 text-yellow-800",
  RUNNING: "bg-blue-100 text-blue-800",
  SUCCESS: "bg-green-100 text-green-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  SENT: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-green-100 text-green-800",
  BOUNCED: "bg-red-100 text-red-800",
  PARTIAL: "bg-yellow-100 text-yellow-800",
};

export function Badge({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  const style = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style} ${className}`}
    >
      {status}
    </span>
  );
}

export function ChannelBadge({ channel }: { channel: string }) {
  const colors: Record<string, string> = {
    whatsapp: "bg-green-100 text-green-800",
    instagram: "bg-pink-100 text-pink-800",
    slack: "bg-purple-100 text-purple-800",
    email: "bg-blue-100 text-blue-800",
    notion: "bg-gray-100 text-gray-800",
    tiktok: "bg-black text-white",
    facebook: "bg-blue-100 text-blue-800",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[channel] ?? "bg-gray-100 text-gray-600"}`}
    >
      {channel}
    </span>
  );
}

type CardProps = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
};

export function Card({ title, subtitle, children, className = "", action }: CardProps) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function CardGrid({ children, cols = 4 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols} gap-4`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {trend && (
        <p
          className={`text-xs mt-1 ${trend.positive ? "text-green-600" : "text-red-600"}`}
        >
          {trend.value}
        </p>
      )}
    </div>
  );
}

type Column<T> = {
  header: string;
  accessor: (row: T) => React.ReactNode;
  className?: string;
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  loading?: boolean;
};

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "Sin datos",
  loading,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">Cargando...</div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">{emptyMessage}</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.header}
                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={keyExtractor(row)} className="hover:bg-gray-50 transition-colors">
              {columns.map((col) => (
                <td
                  key={col.header}
                  className={`px-4 py-3 text-sm text-gray-900 ${col.className ?? ""}`}
                >
                  {col.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

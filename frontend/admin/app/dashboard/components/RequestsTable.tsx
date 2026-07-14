interface RequestsTableProps {
  title: string;
  data: any[];
}

export default function RequestsTable({ title, data }: RequestsTableProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm text-gray-500">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Дата</th>
              <th className="px-4 py-3 text-left">Сотрудник</th>
              <th className="px-4 py-3 text-left">Тип</th>
              <th className="px-4 py-3 text-left">Статус</th>
              <th className="px-4 py-3 text-left">Картриджей</th>
              <th className="px-4 py-3 text-left">Комментарий</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">Нет данных</td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{row.data}</td>
                  <td className="px-4 py-3">{row.employee_name}</td>
                  <td className="px-4 py-3">{row.type}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3 font-medium">{row.cartridges_count}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{row.comment}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
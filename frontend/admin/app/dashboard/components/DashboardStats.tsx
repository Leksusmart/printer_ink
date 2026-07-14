interface DashboardStatsProps {
  stats: any;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  if (!stats) return <div className="text-center py-8 text-gray-500">Загрузка статистики...</div>;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {/* Заправленные */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 text-xl">🖨️</div>
          <h3 className="text-sm font-semibold text-gray-700">Заправленные</h3>
        </div>
        <div className="mt-4 text-3xl font-bold text-gray-900">
          {stats.counters?.filled ?? 0}
        </div>
      </div>

      {/* Пустые */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600 text-xl">❌</div>
          <h3 className="text-sm font-semibold text-gray-700">Пустые</h3>
        </div>
        <div className="mt-4 text-3xl font-bold text-gray-900">
          {stats.counters?.empty ?? 0}
        </div>
      </div>

      {/* Брак */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 text-xl">⚠️</div>
          <h3 className="text-sm font-semibold text-gray-700">Бракованные</h3>
        </div>
        <div className="mt-4 text-3xl font-bold text-gray-900">
          {stats.counters?.defective ?? 0}
        </div>
      </div>
    </div>
  );
}
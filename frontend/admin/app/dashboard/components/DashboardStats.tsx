'use client';
import { useState, useEffect } from 'react';
interface DashboardStatsProps {
    stats: any;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
    const [threshold, setThreshold] = useState(10);

    // Загружаем порог из настроек
    useEffect(() => {
        const loadThreshold = async () => {
            try {
                const res = await fetch('http://localhost:3000/admin/settings');
                if (res.ok) {
                    const data = await res.json();
                    setThreshold(data.refillthreshold);
                }
            } catch (e) {
                console.error('Не удалось загрузить порог:', e);
            }
        };

        loadThreshold();
    }, []);

    if (!stats) {
        return <div className="text-center py-8 text-gray-500">Загрузка статистики...</div>;
    }

    const c = stats.counters || {};
    const h = stats.historyStats || {};
    
    return (
        <>
            {/* Верхние статусные карточки */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Готовые к выдаче */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-emerald-600">
                                <span className="text-2xl">✅</span>
                                <span className="font-medium">Готовые к выдаче</span>
                            </div>
                            <div className="text-5xl font-bold mt-3 text-gray-900">{c.readytoissue ?? 'ERR'}</div>
                        </div>
                    </div>
                </div>

                {/* Ожидают заправки */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-red-600">
                                <span className="text-2xl">❌</span>
                                <span className="font-medium">Ожидают заправки</span>
                            </div>
                            <div className="text-5xl font-bold mt-3 text-gray-900">{c.empty ?? 'ERR'}</div>
                        </div>
                    </div>
                    {c.empty >= threshold && (
                        <p className="text-sm text-red-600 mt-2">Требуется заправка</p>
                    )}
                </div>

                {/* Ожидают ремонта */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-amber-600">
                                <span className="text-2xl">⚠️</span>
                                <span className="font-medium">Ожидают ремонта</span>
                            </div>
                            <div className="text-5xl font-bold mt-3 text-gray-900">{c.repair ?? 'ERR'}</div>
                        </div>
                    </div>
                    {c.repair >= threshold && (
                        <p className="text-sm text-red-600 mt-2">Требуется ремонт</p>
                    )}
                </div>
            </div>

            {/* Большая секция Статистика */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold mb-8 text-center">Статистика</h2>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 text-center">
                    <div>
                        <div className="text-4xl font-bold text-gray-900">{h.totalfilled ?? 'ERR'}</div>
                        <div className="text-sm text-gray-600 mt-1">Заправлено</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-gray-900">{h.totalissued ?? 'ERR'}</div>
                        <div className="text-sm text-gray-600 mt-1">Выдано</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-gray-900">{h.totalscrapped ?? 'ERR'}</div>
                        <div className="text-sm text-gray-600 mt-1">Списано</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-gray-900">{c.totalcartridges ?? 'ERR'}</div>
                        <div className="text-sm text-gray-600 mt-1">Всего картриджей</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-gray-900">{c.idle ?? 'ERR'}</div>
                        <div className="text-sm text-gray-600 mt-1">Простаивающих</div>
                    </div>
                </div>
            </div>
        </>
    );
}
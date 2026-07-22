'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '../api/adminApi';

import DashboardStats from './components/DashboardStats';
import SettingsModal from './components/SettingsModal';
import RequestsTable from './components/RequestsTable';
import CartridgesTable from './components/CartridgesTable';
import EmployersTable from './components/EmployersTable';

export default function DashboardPage() {
    const router = useRouter();
    const [admin, setAdmin] = useState<any>(null);
   
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const [stats, setStats] = useState<any>(null);
    const [activeTableTab, setActiveTableTab] = useState(0);
    const [requestData, setRequestData] = useState<any[]>([]);
    const [cartridgesData, setCartridgesData] = useState<any[]>([]);
    const [employersData, setEmployersData] = useState<any[]>([]);

    const [settings, setSettings] = useState({ refillthreshold: 10, rowscollapsedlimit: 5 });

    const fetchAllData = async () => {
        const [statsRes, requestRes, cartridgesRes, employersRes, settingsRes] =
            await Promise.allSettled([
                adminApi.getStats(),
                adminApi.getRequests(),
                adminApi.getCartridges(),
                adminApi.getEmployers(),
                adminApi.getSettings()
            ]);

        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
        else console.error('Ошибка загрузки статистики:', statsRes.reason);

        if (requestRes.status === 'fulfilled') setRequestData(requestRes.value || []);
        else console.error('Ошибка загрузки таблицы заявок:', requestRes.reason);

        if (cartridgesRes.status === 'fulfilled') setCartridgesData(cartridgesRes.value || []);
        else console.error('Ошибка загрузки таблицы картриджей:', cartridgesRes.reason);

        if (employersRes.status === 'fulfilled') setEmployersData(employersRes.value || []);
        else console.error('Ошибка загрузки таблицы сотрудников:', employersRes.reason);

        if (settingsRes.status === 'fulfilled') setSettings(settingsRes.value);
        else console.error('Ошибка загрузки настроек:', settingsRes.reason);
    };
    const checkSession = async (userPhone: string): Promise<boolean> => {
        try {
            const response = await fetch(`${process.env.CLIENT_URL}:${process.env.PORT_BACKEND}/Employers/search?phone=${userPhone}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                return false;
            }
            return true;
        } catch (e) {
            return false;
        }
    };

    useEffect(() => {
        const session = localStorage.getItem('admin_session');
        if (!session) {
            router.push('/');
            return;
        }

        try {
            const user = JSON.parse(session);

            checkSession(user.phone).then((isSessionValid) => {
                if (!isSessionValid) {
                    router.push('/');
                }
            });

            if (user.role !== 'Admin') {
                router.push('/');
            } else {
                setAdmin(user);
                fetchAllData();
            }
        } catch (e) {
            router.push('/');
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
            <div className="mb-8 flex justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Админ-панель</h1>
                    {admin && <p className="text-gray-600">Добро пожаловать,<br />{admin.fullname}</p>}
                </div>
                <div className="flex items-center shrink-0">
                    <button onClick={() => setIsSettingsModalOpen(true)} className="flex-1 min-w-[160px] sm:flex-initial px-5 py-2.5 bg-white/80 hover:bg-white backdrop-blur-md border border-white/50 shadow-sm text-slate-700 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2">Настройки</button>
                </div>
            </div>


            <DashboardStats stats={stats} />

            {/* Блок таблиц */}
            <div className="mt-8 overflow-hidden rounded-t-3xl border border-gray-200 bg-white shadow-sm">
                {/* Вкладки */}
                <div className="flex gap-1 border-b border-gray-200 bg-gray-50 px-6 pt-6 pb-4">
                    {[
                        '📋 Заявки',
                        '🖨️ Картриджи',
                        '👔 Сотрудники'
                    ].map((tab, index) => {
                        const isActive = activeTableTab === index;

                        return (
                            <button
                                key={index}
                                type="button"
                                onClick={() => setActiveTableTab(index)}
                                className={`px-6 py-3 text-sm font-medium rounded-t-2xl transition-all ${isActive
                                        ?  'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px shadow-sm'
                                        :  'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 border border-transparent'
                                    }`}
                            >
                                {tab}
                            </button>
                        );
                    })}
                </div>


                {/* Содержимое таблицы */}
                <div className="p-6">
                    {activeTableTab === 0 && (
                        <RequestsTable
                            title="📋 Заявки"
                            tableData={requestData}
                            rowsCollapsedLimit={settings.rowscollapsedlimit}
                        />
                    )}

                    {activeTableTab === 1 && (
                        <CartridgesTable
                            title="🖨️ Картриджи"
                            tableData={cartridgesData}
                            rowsCollapsedLimit={settings.rowscollapsedlimit}
                            fetchAllData={fetchAllData}
                            adminId={admin?.id}
                        />
                    )}
                    {activeTableTab === 2 && (
                        <EmployersTable
                            title="👔 Сотрудники"
                            tableData={employersData}
                            rowsCollapsedLimit={settings.rowscollapsedlimit}
                            fetchAllData={fetchAllData}
                        />
                    )}
                    
                </div>
            </div>

            <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} onSuccess={fetchAllData} />
        </div>
    );
}
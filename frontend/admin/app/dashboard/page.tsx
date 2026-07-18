'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '../api/adminApi';

import DashboardStats from './components/DashboardStats';
import CreateUserModal from './components/CreateUserModal';
import DeleteUserModal from './components/DeleteUserModal';
import CreateCartridgeModal from './components/CreateCartridgeModal';
import DeleteCartridgeModal from './components/DeleteCartridgeModal';
import SettingsModal from './components/SettingsModal';
import RequestsTable from './components/RequestsTable';
import CartridgesTable from './components/CartridgesTable';

export default function DashboardPage() {
    const router = useRouter();
    const [admin, setAdmin] = useState<any>(null);
    const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
    const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
    const [isCreateCartridgeModalOpen, setIsCreateCartridgeModalOpen] = useState(false);
    const [isDeleteCartridgeModalOpen, setIsDeleteCartridgeModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const [stats, setStats] = useState<any>(null);
    const [activeTableTab, setActiveTableTab] = useState(0);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [refillRepairData, setRefillRepairData] = useState<any[]>([]);
    const [receivingData, setReceivingData] = useState<any[]>([]);
    const [scrapData, setScrapData] = useState<any[]>([]);
    const [issuanceData, setIssuanceData] = useState<any[]>([]);
    const [cartridgesData, setCartridgesData] = useState<any[]>([]);

    const [settings, setSettings] = useState({ refillthreshold: 10, rowscollapsedlimit: 5 });

    const fetchAllData = async () => {
        const [statsRes, historyRes, refillRepairRes, receivingRes, scrapRes, issuanceRes, cartridgesRes, settingsRes] =
            await Promise.allSettled([
                adminApi.getStats(),
                adminApi.getHistory(),
                adminApi.getRefillRepairRequests(),
                adminApi.getReceivingRequests(),
                adminApi.getScrapRequests(),
                adminApi.getIssuanceRequests(),
                adminApi.getCartridges(),
                adminApi.getSettings()
            ]);

        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
        else console.error('Ошибка загрузки статистики:', statsRes.reason);

        if (historyRes.status === 'fulfilled') setHistoryData(historyRes.value || []);
        else console.error('Ошибка загрузки истории:', historyRes.reason);

        if (refillRepairRes.status === 'fulfilled') setRefillRepairData(refillRepairRes.value || []);
        else console.error('Ошибка загрузки заявок на заправку/ремонт:', refillRepairRes.reason);

        if (receivingRes.status === 'fulfilled') setReceivingData(receivingRes.value || []);
        else console.error('Ошибка загрузки заявок на приёмку:', receivingRes.reason);

        if (scrapRes.status === 'fulfilled') setScrapData(scrapRes.value || []);
        else console.error('Ошибка загрузки заявок на списание:', scrapRes.reason);

        if (issuanceRes.status === 'fulfilled') setIssuanceData(issuanceRes.value || []);
        else console.error('Ошибка загрузки заявок на получение:', issuanceRes.reason);

        if (cartridgesRes.status === 'fulfilled') setCartridgesData(cartridgesRes.value || []);
        else console.error('Ошибка загрузки картриджей:', cartridgesRes.reason);

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

            if (user.role !== 'Admin' || !checkSession(user.phone)) {
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
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Админ-панель</h1>
                    {admin && <p className="text-gray-600">Добро пожаловать,<br />{admin.fullname}</p>}
                </div>
                <div className="flex flex-wrap gap-3">
                    <button onClick={() => setIsCreateUserModalOpen(true)} className="flex-1 min-w-[160px] sm:flex-initial px-5 py-2.5 bg-white/80 hover:bg-white backdrop-blur-md border border-white/50 shadow-sm text-slate-700 rounded-xl font-medium transition-all active:scale-95">Новый пользователь</button>
                    <button onClick={() => setIsDeleteUserModalOpen(true)} className="flex-1 min-w-[160px] sm:flex-initial px-5 py-2.5 bg-white/80 hover:bg-white backdrop-blur-md border border-white/50 shadow-sm text-red-600 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2">Удалить пользователя</button>
                    <button onClick={() => setIsCreateCartridgeModalOpen(true)} className="flex-1 min-w-[160px] sm:flex-initial px-5 py-2.5 bg-white/80 hover:bg-white backdrop-blur-md border border-white/50 shadow-sm text-slate-700 rounded-xl font-medium transition-all active:scale-95">Новый картридж</button>
                    <button onClick={() => setIsDeleteCartridgeModalOpen(true)} className="flex-1 min-w-[160px] sm:flex-initial px-5 py-2.5 bg-white/80 hover:bg-white backdrop-blur-md border border-white/50 shadow-sm text-red-600 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2">Списать картридж</button>
                    <button onClick={() => setIsSettingsModalOpen(true)} className="flex-1 min-w-[160px] sm:flex-initial px-5 py-2.5 bg-white/80 hover:bg-white backdrop-blur-md border border-white/50 shadow-sm text-slate-700 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2">Настройки</button>
                </div>

            </div>

            <DashboardStats stats={stats} />

            {/* Блок таблиц */}
            <div className="mt-8 overflow-hidden rounded-t-3xl border border-gray-200 bg-white shadow-sm">
                {/* Вкладки */}
                <div className="flex gap-1 border-b border-gray-200 bg-gray-50 px-6 pt-6 pb-4">
                    {[
                        { title: '📋 История абсолютно всех заявок' },
                        { title: '⚡ Заявки на заправку/ремонт' },
                        { title: '📥 Заявки на приёмку' },
                        { title: '📤 Заявки на получение' },
                        { title: '🗑️ Заявки на списание' },
                        { title: '🖨️ Картриджи', highlight: true },
                    ].map((tab, index) => {
                        const isActive = activeTableTab === index;

                        return (
                            <button
                                key={index}
                                type="button"
                                onClick={() => setActiveTableTab(index)}
                                className={`px-6 py-3 text-sm font-medium rounded-t-2xl transition-all ${isActive
                                        ? tab.highlight
                                            ? 'bg-white text-indigo-600 border border-indigo-200 border-b-white -mb-px shadow-sm'
                                            : 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px shadow-sm'
                                        : tab.highlight
                                            ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 border border-transparent'
                                    }`}
                            >
                                {tab.title}
                            </button>
                        );
                    })}
                </div>


                {/* Содержимое таблицы */}
                <div className="p-6">
                    {activeTableTab === 0 && (
                        <RequestsTable
                            title="📋 История абсолютно всех заявок"
                            tableData={historyData}
                            showType
                            showStatus
                            showDefect
                            rowsCollapsedLimit={settings.rowscollapsedlimit}
                        />
                    )}

                    {activeTableTab === 1 && (
                        <RequestsTable
                            title="⚡ Заявки на заправку/ремонт"
                            tableData={refillRepairData}
                            rowsCollapsedLimit={settings.rowscollapsedlimit}
                        />
                    )}

                    {activeTableTab === 2 && (
                        <RequestsTable
                            title="📥 Заявки на приёмку"
                            tableData={receivingData}
                            showDefect
                            rowsCollapsedLimit={settings.rowscollapsedlimit}
                        />
                    )}

                    {activeTableTab === 3 && (
                        <RequestsTable
                            title="📤 Заявки на получение"
                            tableData={issuanceData}
                            rowsCollapsedLimit={settings.rowscollapsedlimit}
                        />
                    )}

                    {activeTableTab === 4 && (
                        <RequestsTable
                            title="🗑️ Заявки на списание"
                            tableData={scrapData}
                            rowsCollapsedLimit={settings.rowscollapsedlimit}
                        />
                    )}

                    {activeTableTab === 5 && (
                        <CartridgesTable
                            data={cartridgesData}
                            rowsCollapsedLimit={settings.rowscollapsedlimit}
                        />
                    )}
                </div>
            </div>

            <CreateUserModal isOpen={isCreateUserModalOpen} onClose={() => setIsCreateUserModalOpen(false)} onSuccess={fetchAllData} />
            <DeleteUserModal isOpen={isDeleteUserModalOpen} onClose={() => setIsDeleteUserModalOpen(false)} onSuccess={fetchAllData} />
            <CreateCartridgeModal isOpen={isCreateCartridgeModalOpen} onClose={() => setIsCreateCartridgeModalOpen(false)} onSuccess={fetchAllData} />
            <DeleteCartridgeModal isOpen={isDeleteCartridgeModalOpen} onClose={() => setIsDeleteCartridgeModalOpen(false)} onSuccess={fetchAllData} />
            <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} onSuccess={fetchAllData} />
        </div>
    );
}
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';

// Интерфейсы данных
interface DashboardStats {
    counters: { filled: number; empty: number; defective: number };
    historyStats: { totalFilled: number; totalIssued: number; totalDefects: number; totalScrapped: number; activeOrders: number };
}

interface AdminRequestRow {
    id: number;
    data: string;
    employee_name: string;
    type: string;
    status: string;
    cartridges_count: number;
    isdefective: boolean;
    comment: string;
    lastchangeby_name: string;
    lastchangedata: string;
}

function DashboardContent() {
    // Состояния для открытия/закрытия окон (модалок)
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isCartridgeModalOpen, setIsCartridgeModalOpen] = useState(false);

    const router = useRouter();
    const [admin, setAdmin] = useState<any>(null);

    // Данные с сервера
    const [stats, setStats] = useState<DashboardStats | null>(null);

    // Поля форм создания пользователя
    const [newUserFullname, setNewUserFullname] = useState('');
    const [newUserPhone, setNewUserPhone] = useState('');
    const [newUserRole, setNewUserRole] = useState('User');
    const [newUserPassword, setNewUserPassword] = useState('');

    // Полноценная форма создания картриджа
    const [cartridgeForm, setCartridgeForm] = useState({
        model: '',
        guid: '',
        status: 'Ожидает заправки',
        isdefective: false
    });

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    // дефолтное состояние - должно смениться сервером
    const [settingsForm, setSettingsForm] = useState({
        filled_red_from: 10, filled_red_to: 999,
        filled_yellow_from: 6, filled_yellow_to: 9,
        filled_green_from: 0, filled_green_to: 5,

        empty_red_from: 10, empty_red_to: 999,
        empty_yellow_from: 6, empty_yellow_to: 9,
        empty_green_from: 0, empty_green_to: 5,

        refill_threshold: 10
    });

    const [isSettingsSaving, setIsSettingsSaving] = useState(false);

    // Состояния уведомлений и загрузки для форм
    const [isUserCreating, setIsUserCreating] = useState(false);
    const [isCartridgeCreating, setIsCartridgeCreating] = useState(false);
    const [userMessage, setUserMessage] = useState({ text: '', type: 'success' });
    const [cartridgeMessage, setCartridgeMessage] = useState({ text: '', type: 'success' });

    const requestNewGUID = async () => {
        try {
            const res = await fetch('http://localhost:3000/admin/generate-guid');
            if (res.ok) {
                const data = await res.json();
                setCartridgeForm(prev => ({ ...prev, guid: data.guid }));
            }
        } catch (err) {
            console.error('Не удалось запросить GUID с сервера:', err);
        }
    };

    const getStockLevel = (count: number, type: 'filled' | 'empty') => {
        if (!settingsForm) return { text: 'Загрузка...', color: 'text-gray-500' };

        if (type === 'filled') {
            if (count >= settingsForm.filled_red_from && count <= settingsForm.filled_red_to) {
                return { text: 'Много', color: 'text-red-500 font-bold' };
            }
            if (count >= settingsForm.filled_yellow_from && count <= settingsForm.filled_yellow_to) {
                return { text: 'Норма', color: 'text-amber-500 font-bold' };
            }
            if (count >= settingsForm.filled_green_from && count <= settingsForm.filled_green_to) {
                return { text: 'Малый', color: 'text-emerald-500 font-bold' };
            }
        } else {
            if (count >= settingsForm.empty_red_from && count <= settingsForm.empty_red_to) {
                return { text: 'Много', color: 'text-red-500 font-bold' };
            }
            if (count >= settingsForm.empty_yellow_from && count <= settingsForm.empty_yellow_to) {
                return { text: 'Норма', color: 'text-amber-500 font-bold' };
            }
            if (count >= settingsForm.empty_green_from && count <= settingsForm.empty_green_to) {
                return { text: 'Малый', color: 'text-emerald-500 font-bold' };
            }
        }
        return { text: 'Вне диапазона', color: 'text-gray-400' };
    };


    const [historyData, setHistoryData] = useState<AdminRequestRow[]>([]);
    const [refillData, setRefillData] = useState<AdminRequestRow[]>([]);
    const [repairData, setRepairData] = useState<AdminRequestRow[]>([]);

    const [isScrapModalOpen, setIsScrapModalOpen] = useState(false);
    const [scrapGuid, setScrapGuid] = useState('');
    const [isScrapLoading, setIsScrapLoading] = useState(false);
    const [scrapMessage, setScrapMessage] = useState({ text: '', type: 'success' });

    const fetchAllData = async () => {
        try {
            const [statsRes, historyRes, refillRes, repairRes, settingsRes] = await Promise.all([
                fetch('http://localhost:3000/admin/stats'),
                fetch('http://localhost:3000/admin/history'),
                fetch('http://localhost:3000/admin/refill'),
                fetch('http://localhost:3000/admin/repair'),
                fetch('http://localhost:3000/admin/settings')
            ]);

            // Записываем статистику (счетчики)
            if (statsRes.ok) {
                const statsJson = await statsRes.json();
                setStats(statsJson);
            } else {
                console.error('Ошибка сервера при получении статистики');
            }

            // Записываем историю абсолютно всех заявок
            if (historyRes.ok) {
                const historyJson = await historyRes.json();
                setHistoryData(historyJson);
            }

            // Записываем заявки на заправку
            if (refillRes.ok) {
                const refillJson = await refillRes.json();
                setRefillData(refillJson);
            }

            // Записываем заявки на ремонт
            if (repairRes.ok) {
                const repairJson = await repairRes.json();
                setRepairData(repairJson);
            }

            // ЗАПИСЫВАЕМ НАСТРОЙКИ ИЗ БД
            if (settingsRes.ok) {
                const settingsJson = await settingsRes.json();
                setSettingsForm(settingsJson);
            }

        } catch (err) {
            console.error('Критическая ошибка сети при загрузке данных админки:', err);
        }
    };



    useEffect(() => {
        if (isCartridgeModalOpen && !cartridgeForm.guid) {
            requestNewGUID();
        }
    }, [isCartridgeModalOpen]);

    useEffect(() => {
        const session = localStorage.getItem('admin_session');
        if (!session) {
            router.push('/');
            return;
        }
        try {
            const user = JSON.parse(session);
            if (user.role !== 'Admin') {
                router.push('/');
            } else {
                setAdmin(user);
                fetchAllData();
            }
        } catch {
            router.push('/');
        }
    }, [router]);

    // Обработчик создания пользователя
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setUserMessage({ text: '', type: 'success' });
        setIsUserCreating(true);

        try {
            const res = await fetch('http://localhost:3000/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullname: newUserFullname,
                    phone: newUserPhone,
                    role: newUserRole,
                    password: newUserPassword
                })
            });

            if (res.ok) {
                setUserMessage({ text: 'Пользователь успешно создан!', type: 'success' });
                setNewUserFullname('');
                setNewUserPhone('');
                setNewUserRole('User');
                setNewUserPassword('');
                fetchAllData();
            } else {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Ошибка при создании пользователя');
            }
        } catch (err) {
            const error = err as Error;
            setUserMessage({ text: error.message, type: 'error' });
        } finally {
            setIsUserCreating(false);
        }
    };

    const handleDefectiveChange = (checked: boolean) => {
        const defaultStatus = checked ? 'Ожидает ремонта' : 'Ожидает заправки';
        setCartridgeForm(prev => ({
            ...prev,
            isdefective: checked,
            status: defaultStatus
        }));
    };

    // Обработчик создания картриджа со всеми необходимыми полями
    const handleCreateCartridge = async (e: React.FormEvent) => {
        e.preventDefault();
        setCartridgeMessage({ text: '', type: 'success' });
        setIsCartridgeCreating(true);

        try {
            const session = localStorage.getItem('admin_session');
            const adminId = session ? JSON.parse(session).id : null;

            const response = await fetch('http://localhost:3000/admin/create-cartridge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: cartridgeForm.model,
                    guid: cartridgeForm.guid, // Отправляем зафиксированный бэкенд-GUID
                    status: cartridgeForm.status,
                    isdefective: cartridgeForm.isdefective,
                    adminId: adminId
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Ошибка при создании картриджа');
            }

            setCartridgeForm({ model: '', guid: '', status: 'Ожидает заправки', isdefective: false });
            setIsCartridgeModalOpen(false);
            fetchAllData(); // Полное обновление таблиц и графиков на странице

        } catch (err) {
            const error = err as Error;
            setCartridgeMessage({ text: error.message, type: 'error' });
        } finally {
            setIsCartridgeCreating(false);
        }
    };


    if (!admin) return <div className="p-8 text-center text-slate-500">Проверка доступа...</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
            {/* ШАПКА ПАНЕЛИ */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <h1 className="text-2xl font-bold text-slate-900">Управление картриджами</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsUserModalOpen(true)}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
                    >
                        Создать нового пользователя
                    </button>
                    <button
                        onClick={() => setIsCartridgeModalOpen(true)}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                    >
                        Создать новый картридж
                    </button>

                    {/* НОВАЯ КНОПКА СПИСАНИЯ */}
                    <button
                        onClick={() => setIsScrapModalOpen(true)}
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 flex items-center gap-1.5 shadow-sm"
                    >
                        🗑️ Списать картридж
                    </button>

                    {/* НОВАЯ КНОПКА НАСТРОЕК */}
                    <button
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 flex items-center gap-1.5"
                    >
                        ⚙️ Настройки
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {/* КАРТОЧКА 1: ЗАПРАВЛЕННЫЕ КАРТРИДЖИ */}
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                            <span className="text-xl">🖨️</span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700">Заправленные картриджи</h3>
                    </div>
                    <div className="mt-4 text-3xl font-bold text-gray-900">
                        {stats?.counters.filled ?? 0}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs">
                        <span className="text-gray-400">Уровень запасов</span>
                        <span className={getStockLevel(stats?.counters.filled ?? 0, 'filled').color}>
                            {getStockLevel(stats?.counters.filled ?? 0, 'filled').text}
                        </span>
                    </div>
                </div>

                {/* КАРТОЧКА 2: ПУСТЫЕ КАРТРИДЖИ */}
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                            <span className="text-xl">❌</span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700">Пустые картриджи</h3>
                    </div>
                    <div className="mt-4 text-3xl font-bold text-gray-900">
                        {stats?.counters.empty ?? 0}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs">
                        <span className="text-gray-400">Уровень запасов</span>
                        <span className={getStockLevel(stats?.counters.empty ?? 0, 'empty').color}>
                            {getStockLevel(stats?.counters.empty ?? 0, 'empty').text}
                        </span>
                    </div>
                </div>

                {/* КАРТОЧКА 3: БРАКОВАННЫЕ КАРТРИДЖИ */}
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                            <span className="text-xl">⚠️</span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700">Бракованные картриджи</h3>
                    </div>
                    <div className="mt-4 text-3xl font-bold text-gray-900">
                        {stats?.counters.defective ?? 0}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs">
                        <span className="text-gray-400">Уровень запасов</span>
                        <span className={`font-bold ${(stats?.counters.defective ?? 0) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {(stats?.counters.defective ?? 0) > 0 ? 'Требует списания или Ремонта' : 'Отсутствует'}
                        </span>
                    </div>
                </div>
            </div>


            {/* СЕКЦИЯ СТАТИСТИКИ */}
            <div className="mb-8 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-slate-400 uppercase tracking-wider">Статистика</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 text-center">
                    <div className="border-r border-slate-100 last:border-none">
                        <div className="text-2xl font-bold text-slate-900">{stats?.historyStats.totalFilled ?? 0}</div>
                        <div className="text-xs text-slate-400 mt-1">Заправлено</div>
                    </div>
                    <div className="border-r border-slate-100 last:border-none">
                        <div className="text-2xl font-bold text-slate-900">{stats?.historyStats.totalIssued ?? 0}</div>
                        <div className="text-xs text-slate-400 mt-1">Выдано</div>
                    </div>
                    <div className="border-r border-slate-100 last:border-none">
                        <div className="text-2xl font-bold text-slate-900">{stats?.historyStats.totalDefects ?? 0}</div>
                        <div className="text-xs text-slate-400 mt-1">Брак выявлен</div>
                    </div>
                    <div className="border-r border-slate-100 last:border-none">
                        <div className="text-2xl font-bold text-slate-900">{stats?.historyStats.totalScrapped ?? 0}</div>
                        <div className="text-xs text-slate-400 mt-1">Списано брак</div>
                    </div>
                    <div className="last:border-none">
                        <div className="text-2xl font-bold text-slate-900">{stats?.historyStats.activeOrders ?? 0}</div>
                        <div className="text-xs text-slate-400 mt-1">Активных заявок</div>
                    </div>
                </div>
            </div>

            {/* КОНТЕЙНЕР ДЛЯ ТРЕХ ТАБЛИЦ ДРУГ НАД ДРУГОМ */}
            <div className="space-y-6 mt-8">

                {/* ТАБЛИЦА 1: ВСЕ ЗАЯВКИ */}
                <SortableTable
                    title="📋 История абсолютно всех заявок"
                    data={historyData}
                    columns={[
                        { key: 'data', label: 'Дата создания' },
                        { key: 'employee_name', label: 'Кто создал' },
                        { key: 'type', label: 'Тип' },
                        { key: 'status', label: 'Статус' },
                        { key: 'cartridges_count', label: 'Картриджи (шт)' },
                        { key: 'isdefective', label: 'Дефект' },
                        { key: 'comment', label: 'Комментарий' },
                        { key: 'lastchangeby_name', label: 'Кто изменил' },
                        { key: 'lastchangedata', label: 'Дата изменения' },
                    ]}
                />

                {/* ТАБЛИЦА 2: ЗАЯВКИ НА ЗАПРАВКУ */}
                <SortableTable
                    title="⚡ Заявки на заправку (Ожидают заправки)"
                    data={refillData}
                    columns={[
                        { key: 'data', label: 'Дата создания' },
                        { key: 'employee_name', label: 'Кто создал' },
                        { key: 'cartridges_count', label: 'Картриджи (шт)' },
                        { key: 'comment', label: 'Комментарий' },
                        { key: 'lastchangeby_name', label: 'Кто изменил' },
                        { key: 'lastchangedata', label: 'Дата изменения' },
                    ]}
                />

                {/* ТАБЛИЦА 3: ЗАЯВКИ НА РЕМОНТ */}
                <SortableTable
                    title="🛠️ Заявки на ремонт (Ожидают ремонта)"
                    data={repairData}
                    columns={[
                        { key: 'data', label: 'Дата создания' },
                        { key: 'employee_name', label: 'Кто создал' },
                        { key: 'cartridges_count', label: 'Картриджи (шт)' },
                        { key: 'comment', label: 'Комментарий' },
                        { key: 'lastchangeby_name', label: 'Кто изменил' },
                        { key: 'lastchangedata', label: 'Дата изменения' },
                    ]}
                />

            </div>


            {/* ПОДВАЛ/ОТЛАДКА */}
            <div className="text-center text-xs text-slate-400 mt-8">
                Панель управления принтерами и расходными материалами • v1.0
            </div>

            {/* МОДАЛЬНОЕ ОКНО: СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ */}
            {isUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 font-sans animate-fade-in">
                    <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-8 shadow-2xl relative">

                        <button
                            onClick={() => setIsUserModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
                        >
                            ✕
                        </button>

                        <h2 className="mb-1 text-xl font-bold text-gray-800">
                            Создание нового пользователя
                        </h2>
                        <p className="mb-6 text-xs text-gray-400">
                            Заполните форму и нажмите "Создать"
                        </p>

                        {/* Вывод сообщений об ошибках или успешном создании */}
                        {userMessage.text && (
                            <div className={`mb-4 rounded-lg p-3 text-sm border ${userMessage.type === 'success'
                                ? 'border-green-100 bg-green-50 text-green-700'
                                : 'border-red-100 bg-red-50 text-red-700'
                                }`}>
                                {userMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="ФИО сотрудника"
                                    value={newUserFullname}
                                    onChange={(e) => setNewUserFullname(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
                                />
                            </div>

                            <div>
                                <input
                                    type="tel"
                                    placeholder="Номер телефона"
                                    value={newUserPhone}
                                    onChange={(e) => setNewUserPhone(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
                                />
                            </div>

                            <div>
                                <select
                                    value={newUserRole}
                                    onChange={(e) => setNewUserRole(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                >
                                    <option value="User">User</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>

                            {/* Поле покажется только если выбран Admin */}
                            {newUserRole === 'Admin' && (
                                <div>
                                    <input
                                        type="password"
                                        placeholder="Пароль"
                                        value={newUserPassword}
                                        onChange={(e) => setNewUserPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
                                    />
                                </div>
                            )}


                            <button
                                type="submit"
                                disabled={isUserCreating}
                                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors duration-200 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-sm uppercase tracking-wider"
                            >
                                {isUserCreating ? 'Создание...' : 'Создать'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* МОДАЛЬНОЕ ОКНО: СОЗДАНИЕ КАРТРИДЖА */}
            {isCartridgeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 font-sans animate-fade-in backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-8 shadow-2xl relative">

                        {/* Кнопка закрытия модального окна (крестик) */}
                        <button
                            type="button"
                            onClick={() => setIsCartridgeModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-lg p-1 focus:outline-none"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-bold text-gray-800 mb-2">Создание нового картриджа</h3>
                        <p className="text-xs text-gray-400 mb-5">Заполните форму и нажмите "Создать"</p>

                        {/* Вывод сообщений об ошибках или успешном создании */}
                        {cartridgeMessage.text && (
                            <div className={`mb-4 rounded-lg p-3 text-sm border ${cartridgeMessage.type === 'success'
                                    ? 'border-green-100 bg-green-50 text-green-700'
                                    : 'border-red-100 bg-red-50 text-red-700'
                                }`}>
                                {cartridgeMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleCreateCartridge} className="space-y-4">
                            {/* Ввод модели */}
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">Модель</label>
                                <input
                                    type="text"
                                    placeholder="Например, HP Q2612A"
                                    value={cartridgeForm.model}
                                    onChange={(e) => setCartridgeForm({ ...cartridgeForm, model: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                />
                            </div>

                            {/* Ввод GUID с кнопкой регенерации через бэкенд */}
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">Поле GUID</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Запрос идентификатора..."
                                        value={cartridgeForm.guid}
                                        onChange={(e) => setCartridgeForm({ ...cartridgeForm, guid: e.target.value })}
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-mono text-xs bg-gray-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={requestNewGUID} // По клику запрашиваем генерацию вашей функцией
                                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-gray-400"
                                        title="Перегенерировать через RequestsService"
                                    >
                                        🔄 Обновить
                                    </button>
                                </div>
                            </div>


                            {/* Флаг дефекта (Брак) */}
                            <div className="flex items-center ps-1 py-1">
                                <input
                                    id="isdefective-checkbox"
                                    type="checkbox"
                                    checked={cartridgeForm.isdefective}
                                    onChange={(e) => handleDefectiveChange(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                                />
                                <label htmlFor="isdefective-checkbox" className="ms-2.5 text-sm font-medium text-gray-700 cursor-pointer select-none">
                                    Пометить как неисправный (Брак)
                                </label>
                            </div>

                            {/* Динамический выбор статуса в зависимости от флага брака */}
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">Начальный статус</label>
                                <select
                                    value={cartridgeForm.status}
                                    onChange={(e) => setCartridgeForm({ ...cartridgeForm, status: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm cursor-pointer"
                                >
                                    {cartridgeForm.isdefective ? (
                                        <>
                                            <option value="Ожидает ремонта">Ожидает ремонта</option>
                                            <option value="Списан">Списан</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Ожидает заправки">Ожидает заправки</option>
                                            <option value="Готов к выдаче">Готов к выдаче</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={isCartridgeCreating}
                                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-sm uppercase tracking-wider mt-2 shadow-sm"
                            >
                                {isCartridgeCreating ? 'Создание...' : 'Создать'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* МОДАЛЬНОЕ ОКНО: НАСТРОЙКИ СВЕТОФОРА И ПОРОГОВ */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 font-sans backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-xl border border-gray-100 bg-gray-100 p-8 shadow-2xl relative text-gray-800">

                        <button
                            type="button"
                            onClick={() => setIsSettingsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-lg p-1 focus:outline-none"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Настройка порогов контейнеров</h3>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setIsSettingsSaving(true);
                            try {
                                const res = await fetch('http://localhost:3000/admin/settings', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(settingsForm)
                                });
                                if (res.ok) {
                                    alert('Настройки успешно сохранены!');
                                    setIsSettingsModalOpen(false);
                                    fetchAllData(); // Чтобы пересчитать цвета карточек
                                }
                            } catch {
                                alert('Ошибка сети при сохранении');
                            } finally {
                                setIsSettingsSaving(false);
                            }
                        }} className="space-y-6">

                            <div className="grid grid-cols-2 gap-8">
                                {/* ЛЕВАЯ КОЛОНКА: ЗАПРАВЛЕННЫЕ */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-gray-700 text-center mb-2">Заправленные картриджи</h4>

                                    {/* КРАСНЫЙ */}
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-8 bg-red-500 rounded border border-red-600 shadow-sm" />
                                        <span className="text-xs text-gray-600 font-medium">От</span>
                                        <input type="number" value={settingsForm.filled_red_from} onChange={(e) => setSettingsForm({ ...settingsForm, filled_red_from: +e.target.value })} className="w-14 px-2 py-1 text-center border border-gray-300 rounded text-sm bg-white" />
                                        <span className="text-xs text-gray-600 font-medium">до</span>
                                        <input type="number" value={settingsForm.filled_red_to} onChange={(e) => setSettingsForm({ ...settingsForm, filled_red_to: +e.target.value })} className="w-14 px-2 py-1 text-center border border-gray-300 rounded text-sm bg-white" />
                                    </div>

                                    {/* ЖЕЛТЫЙ */}
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-8 bg-amber-400 rounded border border-amber-500 shadow-sm" />
                                        <span className="text-xs text-gray-600 font-medium">От</span>
                                        <input type="number" value={settingsForm.filled_yellow_from} onChange={(e) => setSettingsForm({ ...settingsForm, filled_yellow_from: +e.target.value })} className="w-14 px-2 py-1 text-center border border-gray-300 rounded text-sm bg-white" />
                                        <span className="text-xs text-gray-600 font-medium">до</span>
                                        <input type="number" value={settingsForm.filled_yellow_to} onChange={(e) => setSettingsForm({ ...settingsForm, filled_yellow_to: +e.target.value })} className="w-14 px-2 py-1 text-center border border-gray-300 rounded text-sm bg-white" />
                                    </div>

                                    {/* ЗЕЛЕНЫЙ */}
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-8 bg-emerald-500 rounded border border-emerald-600 shadow-sm" />
                                        <span className="text-xs text-gray-600 font-medium">От</span>
                                        <input type="number" value={settingsForm.filled_green_from} onChange={(e) => setSettingsForm({ ...settingsForm, filled_green_from: +e.target.value })} className="w-14 px-2 py-1 text-center border border-gray-300 rounded text-sm bg-white" />
                                        <span className="text-xs text-gray-600 font-medium">до</span>
                                        <input type="number" value={settingsForm.filled_green_to} onChange={(e) => setSettingsForm({ ...settingsForm, filled_green_to: +e.target.value })} className="w-14 px-2 py-1 text-center border border-gray-300 rounded text-sm bg-white" />
                                    </div>
                                </div>

                                {/* ПРАВАЯ КОЛОНКА: ПУСТЫЕ */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-gray-700 text-center mb-2">Пустые картриджи</h4>

                                    {/* КРАСНЫЙ */}
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-8 bg-red-500 rounded border border-red-600 shadow-sm" />
                                        <span className="text-xs text-gray-600 font-medium">От</span>
                                        <input type="number" value={settingsForm.empty_red_from} onChange={(e) => setSettingsForm({ ...settingsForm, empty_red_from: +e.target.value })} className="w-14 px-2 py-1 text-center border border-gray-300 rounded text-sm bg-white" />
                                        <span className="text-xs text-gray-600 font-medium">до</span>
                                        <input type="number" value={settingsForm.empty_red_to} onChange={(e) => setSettingsForm({ ...settingsForm, empty_red_to: +e.target.value })} className="w-14 px-2 py-1 text-center border border-gray-300 rounded text-sm bg-white" />
                                    </div>

                                    {/* ЖЕЛТЫЙ */}
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-8 bg-amber-400 rounded border border-amber-500 shadow-sm" />
                                        <span className="text-xs text-gray-600 font-medium">От</span>
                                        <input type="number" value={settingsForm.empty_yellow_from} onChange={(e) => setSettingsForm({ ...settingsForm, empty_yellow_from: +e.target.value })} className="w-14 px-2 py-1 text-center border border-gray-300 rounded text-sm bg-white" />
                                        <span className="text-xs text-gray-600 font-medium">до</span>
                                        <input type="number" value={settingsForm.empty_yellow_to} onChange={(e) => setSettingsForm({ ...settingsForm, empty_yellow_to: +e.target.value })} className="w-14 px-2 py-1 text-center border border-gray-300 rounded text-sm bg-white" />
                                    </div>

                                    {/* ЗЕЛЕНЫЙ */}
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-8 bg-emerald-500 rounded border border-emerald-600 shadow-sm" />
                                        <span className="text-xs text-gray-600 font-medium">От</span>
                                        <input type="number" value={settingsForm.empty_green_from} onChange={(e) => setSettingsForm({ ...settingsForm, empty_green_from: +e.target.value })} className="w-14 px-2 py-1 text-center border border-gray-300 rounded text-sm bg-white" />
                                        <span className="text-xs text-gray-600 font-medium">до</span>
                                        <input type="number" value={settingsForm.empty_green_to} onChange={(e) => setSettingsForm({ ...settingsForm, empty_green_to: +e.target.value })} className="w-14 px-2 py-1 text-center border border-gray-300 rounded text-sm bg-white" />
                                    </div>
                                </div>
                            </div>

                            {/* НИЖНИЙ БЛОК: ПОРОГ ЗАЯВКИ */}
                            <div className="pt-4 border-t border-gray-200 flex items-center justify-between px-4">
                                <span className="text-sm font-semibold text-gray-700">Порог для заявки на заправку включительно:</span>
                                <input type="number" value={settingsForm.refill_threshold} onChange={(e) => setSettingsForm({ ...settingsForm, refill_threshold: +e.target.value })} className="w-20 px-3 py-1.5 text-center border border-gray-300 rounded-lg text-sm bg-white font-bold" />
                            </div>

                            <button
                                type="submit"
                                disabled={isSettingsSaving}
                                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-blue-700 disabled:bg-gray-400 text-sm uppercase tracking-wider shadow-sm mt-4"
                            >
                                {isSettingsSaving ? 'Сохранение...' : 'Сохранить настройки'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* МОДАЛЬНОЕ ОКНО: СПИСАНИЕ КАРТРИДЖА */}
            {isScrapModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 font-sans backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-8 shadow-2xl relative text-gray-800">

                        <button
                            type="button"
                            onClick={() => {
                                setIsScrapModalOpen(false);
                                setScrapGuid('');
                                setScrapMessage({ text: '', type: 'success' });
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-lg p-1 focus:outline-none"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-bold text-gray-900 mb-2">Списание картриджа</h3>
                        <p className="text-xs text-gray-400 mb-5">Введите GUID устройства для изменения его статуса на "Списан"</p>

                        {scrapMessage.text && (
                            <div className={`mb-4 rounded-lg p-3 text-sm border ${scrapMessage.type === 'success' ? 'border-green-100 bg-green-50 text-green-700' : 'border-red-100 bg-red-50 text-red-700'
                                }`}>
                                {scrapMessage.text}
                            </div>
                        )}

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!scrapGuid.trim()) return;
                            setScrapMessage({ text: '', type: 'success' });
                            setIsScrapLoading(true);

                            try {
                                const res = await fetch('http://localhost:3000/admin/scrap-cartridge', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ guid: scrapGuid.trim() })
                                });

                                if (!res.ok) {
                                    const err = await res.json().catch(() => ({}));
                                    throw new Error(err.message || 'Не удалось списать картридж');
                                }

                                setScrapMessage({ text: 'Картридж успешно списан (Статус: Списан)!', type: 'success' });
                                setScrapGuid('');
                                fetchAllData(); // Мгновенно обновляем таблицы и счетчики на экране

                                // Закрываем окно через 1.5 секунды, чтобы админ успел увидеть зеленый статус успеха
                                setTimeout(() => setIsScrapModalOpen(false), 1500);
                            } catch (err) {
                                const error = err as Error;
                                setScrapMessage({ text: error.message, type: 'error' });
                            } finally {
                                setIsScrapLoading(false);
                            }
                        }} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">Идентификатор GUID</label>
                                <input
                                    type="text"
                                    placeholder="Вставьте или введите GUID картриджа"
                                    value={scrapGuid}
                                    onChange={(e) => setScrapGuid(e.target.value)}
                                    required
                                    disabled={isScrapLoading}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm font-mono"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isScrapLoading || !scrapGuid.trim()}
                                className="w-full rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 text-sm uppercase tracking-wider shadow-sm"
                            >
                                {isScrapLoading ? 'Списание...' : 'Списать'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Загрузка панели...</div>}>
            <DashboardContent />
        </Suspense>
    );
}

interface TableColumn {
    key: keyof AdminRequestRow;
    label: string;
}

interface SortableTableProps {
    title: string;
    columns: TableColumn[];
    data: AdminRequestRow[];
}

function SortableTable({ title, columns, data }: SortableTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: keyof AdminRequestRow; direction: 'asc' | 'desc' } | null>(null);

    // Логика сортировки
    const sortedItems = [...data].sort((a, b) => {
        if (!sortConfig) return 0;

        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const requestSort = (key: keyof AdminRequestRow) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm mb-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-gray-500">
                    <thead className="bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => requestSort(col.key)}
                                    className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors select-none whitespace-nowrap"
                                >
                                    <div className="flex items-center gap-1">
                                        {col.label}
                                        <span className="text-gray-400 text-[10px]">
                                            {sortConfig?.key === col.key
                                                ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')
                                                : ' ↕'}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 border-t border-gray-100 text-xs">
                        {sortedItems.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-8 text-gray-400">
                                    Нет заявок в данной категории
                                </td>
                            </tr>
                        ) : (
                            sortedItems.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50/70 transition-colors">
                                    {columns.map((col) => (
                                        <td key={col.key} className="px-4 py-3 text-gray-900 max-w-xs truncate">
                                            {col.key === 'isdefective' ? (
                                                row[col.key] ? (
                                                    <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600 border border-red-100">Брак</span>
                                                ) : (
                                                    <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-600 border border-green-100">Нет</span>
                                                )
                                            ) : col.key === 'status' ? (
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.status === 'Завершен' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                    {row.status}
                                                </span>
                                            ) : (
                                                String(row[col.key])
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

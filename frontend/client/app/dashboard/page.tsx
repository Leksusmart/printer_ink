'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import QRScanner from './components/QRScanner';
interface CartridgeItem {
    mode: 'guid' | 'manual';
    guid: string;
    model: string;
    status: string;
    count: string;
    isDefective: boolean;
    isResolved: boolean;
    lookupError: string;
}

interface Employer {
    id: number;
    phone: string;
    fullname: string;
    role: string;
}

// Тип операции — это не "выбор", а тип заявки, который отправляется на бэкенд (см. baseData.type в handleSubmit)
type OperationType = 'ПРИЕМКА' | 'ПОЛУЧЕНИЕ' | 'ЗАПРАВКА_РЕМОНТ';

// Человекочитаемое значение поля type, которое уходит в заявку на бэкенд
const OPERATION_TYPE_LABEL: Record<OperationType, string> = {
    ПРИЕМКА: 'Приёмка',
    ПОЛУЧЕНИЕ: 'Получение',
    ЗАПРАВКА_РЕМОНТ: 'Заправка/ремонт',
};

const emptyRowForType = (_type: OperationType): CartridgeItem => ({
    mode: 'guid', guid: '', model: '', status: '', count: '', isDefective: false, isResolved: false, lookupError: ''
});

const qrImageUrl = (data: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data)}`;


function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userPhone = searchParams.get('phone') || '';

    const [currentUser, setCurrentUser] = useState<Employer | null>(null);
    const [availableModels, setAvailableModels] = useState<string[]>([]);

    const [operationType, setOperationType] = useState<OperationType>('ПРИЕМКА');
    const [cartridges, setCartridges] = useState<CartridgeItem[]>([emptyRowForType('ПРИЕМКА')]);
    const [comment, setComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [toastMessage, setToastMessage] = useState('');

    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [activeScanRowIndex, setActiveScanRowIndex] = useState<number | null>(null);


    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 2000);
    };

    const isFormValid = cartridges.every((item) =>
        item.mode === 'guid' ? item.isResolved : item.model.trim() !== ''
    );

    const openScannerForRow = (index: number) => {
        setActiveScanRowIndex(index);
        setIsScannerOpen(true);
    };

    const handleScanSuccess = async (scannedGuid: string) => {
        if (activeScanRowIndex === null) return;
        const cleanGuid = scannedGuid.trim();

        // Проверка на дубликаты среди уже имеющихся строк
        const isDuplicate = cartridges.some((item, idx) => idx !== activeScanRowIndex && item.guid === cleanGuid);
        if (isDuplicate) {
            showToast('Этот картридж уже добавлен в список!');
            setIsScannerOpen(false);
            setActiveScanRowIndex(null);
            return;
        }

        // Просто обновляем состояние строки
        const updatedCartridges = [...cartridges];
        updatedCartridges[activeScanRowIndex] = {
            ...updatedCartridges[activeScanRowIndex],
            mode: 'guid',
            guid: cleanGuid,
            lookupError: ''
        };

        setCartridges(updatedCartridges);
        setTimeout(() => {
            setIsScannerOpen(false);
            setActiveScanRowIndex(null);
        }, 100);
    };
    useEffect(() => {
        async function loadInitialData() {
            try {
                setIsLoading(true);
                if (!userPhone) throw new Error('Телефон не указан');

                const employerResponse = await fetch(`${process.env.CLIENT_URL}:${process.env.PORT_BACKEND}/employers/admin-login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: userPhone })
                });

                if (!employerResponse.ok) throw new Error('Не удалось загрузить данные сотрудника');
                const employerData: Employer = await employerResponse.json();
                setCurrentUser(employerData);

                // Загрузка моделей
                const cartridgesResponse = await fetch(`${process.env.CLIENT_URL}:${process.env.PORT_BACKEND}/cartridges`);
                if (cartridgesResponse.ok) {
                    const data = await cartridgesResponse.json();
                    const models = [...new Set<string>(data.map((c: any) => c.model))];
                    setAvailableModels(models);
                }
            } catch (err) {
                setError((err as Error).message || 'Ошибка загрузки');
            } finally {
                setIsLoading(false);
            }
        }

        loadInitialData();
    }, [userPhone]);

    useEffect(() => {
        const rowIndexToCheck = cartridges.findIndex(
            (item) => item.mode === 'guid' && item.guid.trim() !== '' && !item.isResolved && !item.lookupError
        );

        if (rowIndexToCheck !== -1 && cartridges[rowIndexToCheck].guid.length === 36) {
            lookupCartridgeByGuid(rowIndexToCheck);
        }
    }, [cartridges]);

    const addCartridgeRow = () => {
        setCartridges([...cartridges, emptyRowForType(operationType)]);
    };

    const removeCartridgeRow = (indexToRemove: number) => {
        const updated = cartridges.filter((_, i) => i !== indexToRemove);
        setCartridges(updated);
    };

    const updateCartridge = (index: number, key: keyof CartridgeItem, value: string | boolean) => {
        const updated = [...cartridges];
        updated[index] = { ...updated[index], [key]: value };
        setCartridges(updated);
    };

    // Меняет тип операции и сбрасывает список картриджей на пустую строку
    const handleOperationTypeChange = (type: OperationType) => {
        setOperationType(type);
        setCartridges([emptyRowForType(type)]);
    };

    // Переключить строку в ручной режим ("на картридже нет GUID/QR") — доступно только для ПРИЕМКИ
    const switchToManual = (index: number) => {
        const updated = [...cartridges];
        updated[index] = {
            ...updated[index],
            mode: 'manual',
            guid: '',
            status: '',
            isResolved: false,
            lookupError: '',
        };
        setCartridges(updated);
    };

    // Вернуть строку в режим сканирования GUID
    const switchToGuid = (index: number) => {
        const updated = [...cartridges];
        updated[index] = {
            ...updated[index],
            mode: 'guid',
            model: '',
            count: '',
            isResolved: false,
            lookupError: '',
        };
        setCartridges(updated);
    };

    // Сбросить найденный (но невалидный) GUID, чтобы ввести другой
    const resetGuidRow = (index: number) => {
        const updated = [...cartridges];
        updated[index] = {
            ...updated[index],
            guid: '',
            model: '',
            status: '',
            isResolved: false,
            lookupError: '',
        };
        setCartridges(updated);
    };

    // Ищем картридж по GUID на бэкенде: подтягиваем его модель и текущий статус
    // GET /cartridges/search?guid=... → { id, model, guid, status, isDefective, lastchangedata, lastchangeby }
    const lookupCartridgeByGuid = async (index: number) => {
        const guidValue = cartridges[index].guid.trim();

        if (!guidValue) return;

        try {
            const response = await fetch(`${process.env.CLIENT_URL}:${process.env.PORT_BACKEND}/cartridges/search?guid=${encodeURIComponent(guidValue)}`);
            if (!response.ok) {
                setCartridges((prev) => {
                    const updated = [...prev];
                    updated[index] = { ...updated[index], isResolved: false, lookupError: 'Картридж с таким GUID не найден' };
                    return updated;
                });
                return;
            }
            const data = await response.json();

            // Для ПРИЕМКИ принять можно только картридж, который сейчас числится как "Выдан"
            // ⚠️ Строка статуса "Выдан" — предположение по названию в БД, уточните точное значение
            if (operationType === 'ПРИЕМКА' && data.status !== 'Выдан') {
                setCartridges((prev) => {
                    const updated = [...prev];
                    updated[index] = {
                        ...updated[index],
                        guid: guidValue,
                        model: data.model,
                        status: data.status,
                        isResolved: false,
                        lookupError: `Принимать можно только картриджи со статусом "Выдан" (текущий статус: ${data.status})`,
                    };
                    return updated;
                });
                return;
            }
            if (operationType === 'ПОЛУЧЕНИЕ' && data.status !== 'Готов к выдаче') {
                setCartridges((prev) => {
                    const updated = [...prev];
                    updated[index] = {
                        ...updated[index],
                        guid: guidValue,
                        model: data.model,
                        status: data.status,
                        isResolved: false,
                        lookupError: `Получать можно только картриджи со статусом "Готов к выдаче" (текущий статус: ${data.status})`,
                    };
                    return updated;
                });
                return;
            }
            // Заправка/ремонт — принять можно только картридж со статусом "Ожидает заправки" или "Ожидает ремонта"
            const ЗАПРАВКА_РЕМОНТ_СТАТУСЫ = ['Ожидает заправки', 'Ожидает ремонта'];
            if (operationType === 'ЗАПРАВКА_РЕМОНТ' && !ЗАПРАВКА_РЕМОНТ_СТАТУСЫ.includes(data.status)) {
                setCartridges((prev) => {
                    const updated = [...prev];
                    updated[index] = {
                        ...updated[index],
                        guid: guidValue,
                        model: data.model,
                        status: data.status,
                        isResolved: false,
                        lookupError: `На заправку/ремонт можно принять только картриджи со статусом "Ожидает заправки" или "Ожидает ремонта" (текущий статус: ${data.status})`,
                    };
                    return updated;
                });
                return;
            }
            // Защита от дубликатов: нельзя добавить один и тот же картридж в заявку дважды.
            // Строку с повторным GUID просто очищаем и показываем предупреждение по центру экрана.
            const isDuplicateInRequest = cartridges.some(
                (c, i) => i !== index && c.mode === 'guid' && c.isResolved && c.guid === guidValue
            );

            if (isDuplicateInRequest) {
                setCartridges((prev) => {
                    const updated = [...prev];
                    updated[index] = {
                        ...updated[index],
                        guid: '',
                        model: '',
                        status: '',
                        isResolved: false,
                        lookupError: '',
                    };
                    return updated;
                });
                showToast('Этот картридж уже добавлен в заявку');
                return;
            }

            setCartridges((prev) => {
                const updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    guid: guidValue,
                    model: data.model,
                    status: data.status,
                    isResolved: true,
                    lookupError: '',
                };
                return updated;
            });
        } catch {
            setCartridges((prev) => {
                const updated = [...prev];
                updated[index] = { ...updated[index], isResolved: false, lookupError: 'Ошибка при поиске картриджа' };
                return updated;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!currentUser) {
            alert('Ошибка: Данные сотрудника еще не загрузились!');
            return;
        }

        // Проверка дубликатов среди отсканированных картриджей
        const resolvedGuids = cartridges
            .filter(item => item.mode === 'guid' && item.guid)
            .map(item => item.guid);

        const hasDuplicates = new Set(resolvedGuids).size !== resolvedGuids.length;
        if (hasDuplicates) {
            alert('В заявке указан один и тот же картридж дважды');
            return;
        }

        // Собираем валидные данные с формы
        const manualItems = cartridges.filter(item => item.mode === 'manual' && item.model.trim() && Number(item.count) > 0);
        const scannedItems = cartridges.filter(item => item.mode === 'guid' && item.guid && !item.lookupError);

        if (manualItems.length === 0 && scannedItems.length === 0) {
            alert('Заявка пуста. Нечего отправлять.');
            return;
        }

        // Делим на две кучи: исправные и неисправные
        // Обратите внимание: для операций отличных от ПРИЕМКА, все картриджи по умолчанию считаются исправными (isDefective = false)
        const isPriemka = operationType === 'ПРИЕМКА';

        const healthyScanned = scannedItems.filter(item => !isPriemka || !item.isDefective);
        const healthyManual = manualItems.filter(item => !isPriemka || !item.isDefective);

        const defectiveScanned = isPriemka ? scannedItems.filter(item => item.isDefective) : [];
        const defectiveManual = isPriemka ? manualItems.filter(item => item.isDefective) : [];

        // Массив для пакетов запросов (максимум 2 элемента)
        const requestsPayloads: any[] = [];

        // Функция для сборки единого комбинированного пакета
        const buildPayload = (scanned: typeof scannedItems, manual: typeof manualItems, isDefective: boolean) => ({
            type: OPERATION_TYPE_LABEL[operationType],
            isDefective,
            EmployeeID: currentUser.id,
            comment: comment.trim(),
            guids: scanned.map(item => item.guid), // Существующие GUID
            newCartridges: manual.map(item => ({   // Новые картриджи (модель + количество)
                model: item.model,
                amount: Number(item.count)
            }))
        });

        if (healthyScanned.length > 0 || healthyManual.length > 0) {
            requestsPayloads.push({
                payload: buildPayload(healthyScanned, healthyManual, false),
                manualSource: healthyManual // сохраняем ссылку для связи модели и сгенерированных GUID
            });
        }

        if (defectiveScanned.length > 0 || defectiveManual.length > 0) {
            requestsPayloads.push({
                payload: buildPayload(defectiveScanned, defectiveManual, true),
                manualSource: defectiveManual
            });
        }

        let manuallyCreatedCartridges: { guid: string; model: string; isDefective: boolean }[] = [];

        try {
            const url = `${process.env.CLIENT_URL}:${process.env.PORT_BACKEND}/requests`;

            // Отправляем запросы (максимум 2 параллельных fetch-запроса)
            const responses = await Promise.all(
                requestsPayloads.map(async ({ payload, manualSource }) => {
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
                    const result = await res.json();

                    if (result.success && Array.isArray(result.GUIDs) && result.GUIDs.length > 0) {
                        // Распределяем вернувшиеся GUID-ы обратно по моделям из этой группы
                        let guidIndex = 0;
                        manualSource.forEach((item: any) => {
                            const amount = Number(item.count);
                            for (let i = 0; i < amount; i++) {
                                if (result.GUIDs[guidIndex]) {
                                    manuallyCreatedCartridges.push({
                                        guid: result.GUIDs[guidIndex],
                                        model: item.model,
                                        isDefective: payload.isDefective
                                    });
                                    guidIndex++;
                                }
                            }
                        });
                    }
                    return result;
                })
            );

            // Очищаем форму при успехе
            setCartridges([emptyRowForType(operationType)]);
            setComment('');

            // Редирект на QR-коды, если создавались новые картриджи
            if (manuallyCreatedCartridges.length > 0) {
                sessionStorage.removeItem('generatedCartridges');
                sessionStorage.setItem('generatedCartridges', JSON.stringify(manuallyCreatedCartridges));
                router.push(`/dashboard/pages/cartridgesQR?phone=${encodeURIComponent(userPhone)}`);
            } else {
                alert('Принято!');
            }

        } catch (err) {
            console.error('Ошибка отправки сгруппированных заявок:', err);
            alert(`Ошибка: ${(err as Error).message}`);
        }
    };


    if (isLoading) return <div className="flex min-h-screen items-center justify-center text-gray-500">Загрузка...</div>;
    if (error) return <div className="flex min-h-screen items-center justify-center text-red-500">{error}</div>;

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans">
            {/* ТОСТ ПРЕДУПРЕЖДЕНИЯ */}
            {toastMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                    <div className="rounded bg-gray-900/90 px-5 py-3 text-sm font-medium text-white shadow-lg">
                        {toastMessage}
                    </div>
                </div>
            )}
            {/* МОДАЛЬНОЕ ОКНО СКАНИРОВАНИЯ */}
            {isScannerOpen && (
                <QRScanner
                    onScanSuccess={handleScanSuccess}
                    onClose={() => {
                        setIsScannerOpen(false);
                        setActiveScanRowIndex(null);
                    }}
                />
            )}

            <div className="w-full max-w-xl space-y-4 rounded border border-blue-400 bg-white p-6 shadow-sm">

                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={() => router.push('/')}
                        className="text-xs text-gray-400 hover:text-red-500 font-medium tracking-wide uppercase transition-colors duration-200 flex items-center gap-1"
                    >
                        ← Выйти из системы
                    </button>

                    <h1 className="text-xl font-normal text-gray-800">Заявка на картриджи</h1>
                    <p className="mt-1 text-sm text-gray-400">Отсканируйте QR-код или введите GUID</p>
                </div>

                <div className="relative">
                    <select disabled className="w-full cursor-not-allowed appearance-none rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
                        <option>{currentUser ? currentUser.fullname : 'Загрузка сотрудника...'}</option>
                    </select>
                </div>

                <div className="flex overflow-hidden rounded border border-blue-500">
                    <button
                        type="button"
                        onClick={() => handleOperationTypeChange('ПРИЕМКА')}
                        className={`flex-1 py-2 text-xs font-bold tracking-wider transition-colors ${operationType === 'ПРИЕМКА' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
                    >
                        ПОЛОЖИТЬ
                    </button>
                    <button
                        type="button"
                        onClick={() => handleOperationTypeChange('ЗАПРАВКА_РЕМОНТ')}
                        className={`flex-1 py-2 text-xs font-bold tracking-wider transition-colors ${operationType === 'ЗАПРАВКА_РЕМОНТ' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
                    >
                        ЗАПРАВИТЬ И ОТРЕМОНТИРОВАТЬ
                    </button>
                    <button
                        type="button"
                        onClick={() => handleOperationTypeChange('ПОЛУЧЕНИЕ')}
                        className={`flex-1 py-2 text-xs font-bold tracking-wider transition-colors ${operationType === 'ПОЛУЧЕНИЕ' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
                    >
                        ЗАБРАТЬ
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {cartridges.map((item, index) => (
                        <div key={index} className="space-y-3 rounded border border-dashed border-gray-200 bg-gray-50/50 p-3">

                            {item.mode === 'guid' ? (
                                <>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            title={item.model ? "Пересканировать QR-код" : "Нажмите чтобы начать сканировать QR картриджа"}
                                            onClick={() => openScannerForRow(index)}
                                            className={`flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded transition-colors
        ${item.model
                                                    ? "border border-transparent bg-transparent" // Картинка без рамок, когда картридж НАЙДЕН
                                                    : "border border-blue-500 bg-blue-50 text-sm font-bold text-blue-600 hover:bg-blue-100 active:bg-blue-200" // Синяя кнопка во время ввода/сканирования
                                                }`}
                                        >
                                            {item.model ? (
                                                // Картинка генерируется и показывается ТОЛЬКО если сервер подтвердил существование картриджа
                                                <img
                                                    src={qrImageUrl(item.guid)}
                                                    alt="ERROR"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                // Пока картридж не найден или текст только вводится, отображается надпись
                                                <span>Scan QR</span>
                                            )}
                                        </button>


                                        <div className="flex-1 space-y-2">
                                            {item.model ? (
                                                <div className="space-y-1 rounded border border-gray-200 bg-white px-3 py-2">
                                                    <p className="text-xs break-all text-gray-500">
                                                        GUID: <span className="font-medium text-gray-700">{item.guid}</span>
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Модель: <span className="font-medium text-gray-700">{item.model}</span>
                                                        {'   '}
                                                        Текущий статус: <span className="font-medium text-gray-700">{item.status}</span>
                                                    </p>
                                                    {operationType === 'ПРИЕМКА' && (
                                                        <div className="space-y-1.5">
                                                            <label className="block text-sm text-gray-700">Картридж исправен?</label>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateCartridge(index, 'isDefective', false)}
                                                                    className={`px-4 py-1.5 text-xs font-bold rounded border ${!item.isDefective ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-gray-300'}`}
                                                                >
                                                                    ДА
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateCartridge(index, 'isDefective', true)}
                                                                    className={`px-4 py-1.5 text-xs font-bold rounded border ${item.isDefective ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-gray-300'}`}
                                                                >
                                                                    НЕТ
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {!item.isResolved && (
                                                        <button
                                                            type="button"
                                                            onClick={() => resetGuidRow(index)}
                                                            className="text-xs text-blue-500 underline underline-offset-2"
                                                        >
                                                            Ввести другой GUID
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Введите GUID"
                                                        value={item.guid}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                const updated = [...cartridges];

                                                                const isDuplicate = cartridges.some(
                                                                    (c, i) => i !== index && c.mode === 'guid' && c.guid.trim() === value && value !== ''
                                                                );
                                                                if (isDuplicate) {
                                                                    showToast('Этот картридж уже добавлен в заявку!');

                                                                    // Сбрасываем текущую строку, чтобы не плодить дубликаты
                                                                    updated[index] = {
                                                                        ...updated[index],
                                                                        mode: 'guid',
                                                                        guid: '',
                                                                        model: '',
                                                                        status: '',
                                                                        isResolved: false,
                                                                        lookupError: ''
                                                                    };
                                                                    setCartridges(updated);
                                                                    return;
                                                                }
                                                                updated[index] = {
                                                                    ...updated[index],
                                                                    mode: 'guid',
                                                                    guid: value,
                                                                    lookupError: ''
                                                                };
                                                                setCartridges(updated);
                                                            }}
                                                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 placeholder-gray-400"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => lookupCartridgeByGuid(index)}
                                                        className="rounded border border-blue-500 bg-white px-3 py-2 text-xs font-bold text-blue-600"
                                                    >
                                                        Найти
                                                    </button>
                                                </div>
                                            )}
                                            {item.lookupError && (
                                                <p className="text-xs text-red-500">{item.lookupError}</p>
                                            )}
                                        </div>
                                    </div>

                                    {operationType === 'ПРИЕМКА' && (
                                        <button
                                            type="button"
                                            onClick={() => switchToManual(index)}
                                            className="text-xs text-blue-500 underline underline-offset-2"
                                        >
                                            На картридже нет ни GUID ни QR — ввести вручную
                                        </button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <select
                                        value={item.model}
                                        onChange={(e) => updateCartridge(index, 'model', e.target.value)}
                                        required
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 bg-white"
                                    >
                                        <option value="">Выберите картридж</option>
                                        {availableModels.map((m) => <option key={m} value={m}>{m}</option>)}
                                    </select>

                                    <input
                                        type="number"
                                        placeholder="Введите количество картриджей"
                                        value={item.count}
                                        onChange={(e) => updateCartridge(index, 'count', e.target.value)}
                                        required
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 placeholder-gray-400"
                                    />

                                    <div className="space-y-1.5">
                                        <label className="block text-sm text-gray-700">Картриджи исправны?</label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateCartridge(index, 'isDefective', false)}
                                                className={`px-4 py-1.5 text-xs font-bold rounded border ${!item.isDefective ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-gray-300'}`}
                                            >
                                                ДА
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateCartridge(index, 'isDefective', true)}
                                                className={`px-4 py-1.5 text-xs font-bold rounded border ${item.isDefective ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-gray-300'}`}
                                            >
                                                НЕТ
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => switchToGuid(index)}
                                        className="text-xs text-blue-500 underline underline-offset-2"
                                    >
                                        Вернуться к сканированию GUID
                                    </button>
                                </>
                            )}

                            {cartridges.length > 1 && (
                                <div className="flex justify-end pt-1">
                                    <button
                                        type="button"
                                        onClick={() => removeCartridgeRow(index)}
                                        title="Удалить этот картридж"
                                        className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                                    >
                                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                pathLength="1"
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addCartridgeRow}
                        className="w-full rounded border border-dashed border-blue-500 bg-white py-2.5 text-xs font-bold tracking-wider text-blue-600 uppercase"
                    >
                        + добавить другой картридж
                    </button>

                    <textarea
                        placeholder="Комментарий"
                        rows={2}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 placeholder-gray-400 resize-none"
                    />

                    <button
                        type="submit"
                        className={`w-full py-3 font-bold text-xs tracking-wider rounded uppercase transition-colors duration-200 ${isFormValid
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                            : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                            }`}
                    >
                        отправить заявку
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div>Загрузка панели...</div>}>
            <DashboardContent />
        </Suspense>
    );
}
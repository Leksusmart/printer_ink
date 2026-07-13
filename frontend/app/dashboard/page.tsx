'use client';

import { useState, useEffect } from 'react';
// Импортируем useRouter (для кнопки "Выйти") и useSearchParams (чтобы прочитать телефон из адреса страницы)
import { useRouter, useSearchParams } from 'next/navigation';

// Один картридж в форме заявки.
// mode: 'guid'   — обычный путь: сканируем/вводим GUID, модель и статус подтягиваются с бэкенда
// mode: 'manual' — резервный путь: у картриджа нет GUID/QR, вводим модель и количество вручную
interface CartridgeItem {
    mode: 'guid' | 'manual';
    guid: string;
    model: string;
    status: string;       // актуально только для mode: 'guid' — статус, пришедший с бэкенда
    count: string;        // актуально только для mode: 'manual'
    isdeflective: boolean;
    isResolved: boolean;  // GUID найден и подтянут с бэкенда
    lookupError: string;
}

// Описываем, как выглядит сотрудник в базе данных
interface Employer {
    id: number;
    phone: string;
    fullname: string;
    role: string;
}

const emptyRowForType = (_type: 'ПРИЕМКА' | 'ПОЛУЧЕНИЕ'): CartridgeItem => (
    { mode: 'guid', guid: '', model: '', status: '', count: '', isdeflective: false, isResolved: false, lookupError: '' }
);

export default function DashboardPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    // Читаем телефон из адреса сайта (например, ?phone=89008000010)
    const userPhone = searchParams.get('phone') || '';

    // 1. Храним реального сотрудника из БД здесь. По умолчанию — null (еще не загрузился)
    const [currentUser, setCurrentUser] = useState<Employer | null>(null);

    // 2. Храним реальный список моделей картриджей из БД здесь (нужен для ручного режима)
    const [availableModels, setAvailableModels] = useState<string[]>([]);

    // Состояния формы заявки
    const [operationType, setOperationType] = useState<'ПРИЕМКА' | 'ПОЛУЧЕНИЕ'>('ПРИЕМКА');
    const [cartridges, setCartridges] = useState<CartridgeItem[]>([emptyRowForType('ПРИЕМКА')]);
    const [comment, setComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // ПРОВЕРКА: форма валидна, если каждая строка либо успешно нашла картридж по GUID,
    // либо (в ручном режиме) заполнены модель и количество
    const isFormValid = cartridges.every((item) =>
        item.mode === 'guid'
            ? item.isResolved
            : item.model.trim() !== '' && item.count.toString().trim() !== ''
    );

    // 🔄 ЭФФЕКТ: срабатывает АВТОМАТИЧЕСКИ сразу при открытии этой страницы в браузере
    useEffect(() => {

        async function loadInitialData() {
            try {
                setIsLoading(true);

                // --- ЗАПРОС 1: Получаем данные вошедшего сотрудника ---
                if (!userPhone) {
                    throw new Error('Телефон не указан в адресе страницы. Пожалуйста, авторизуйтесь заново.');
                }
                const employerResponse = await fetch(`http://localhost:3000/Employers/search?phone=${encodeURIComponent(userPhone)}`);
                if (!employerResponse.ok) throw new Error('Не удалось загрузить данные сотрудника');
                const employerData: Employer = await employerResponse.json();
                setCurrentUser(employerData); // Сохраняем реального человека в память фронтенда!

                // --- ЗАПРОС 2: Получаем список моделей картриджей из БД (для ручного режима) ---
                const cartridgesResponse = await fetch('http://localhost:3000/cartridges');
                if (cartridgesResponse.ok) {
                    const cartridgesData = await cartridgesResponse.json();
                    const allModels: string[] = cartridgesData.map((c: { model: string }) => c.model);
                    const uniqueModels = Array.from(new Set(allModels));
                    setAvailableModels(uniqueModels);
                }

            } catch (err) {
                const error = err as Error;
                setError(error.message || 'Ошибка загрузки данных');
            } finally {
                setIsLoading(false);
            }
        }

        loadInitialData();
    }, [userPhone]);

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
    const handleOperationTypeChange = (type: 'ПРИЕМКА' | 'ПОЛУЧЕНИЕ') => {
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
    // GET /cartridges/search?guid=... → { id, model, guid, status, isdeflective, lastchangedata, lastchangeby }
    const lookupCartridgeByGuid = async (index: number) => {
        const guidValue = cartridges[index].guid.trim();
        if (!guidValue) return;

        try {
            const response = await fetch(`http://localhost:3000/cartridges/search?guid=${encodeURIComponent(guidValue)}`);
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

        const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

        if (!currentUser) {
            alert('Ошибка: Данные сотрудника еще не загрузились!');
            return;
        }

        let allGeneratedGuids: string[] = [];
        let successfulCount = 0;


        try {
            for (const item of cartridges) {
                // Пропускаем незаполненные строки
                if (item.mode === 'guid' && !item.isResolved) continue;
                if (item.mode === 'manual' && !item.model.trim()) continue;

                // Базовые поля, общие для обоих режимов
                const baseData = {
                    type: operationType === 'ПРИЕМКА' ? 'Приёмка' : 'Получение',
                    status: 'создана',
                    data: currentDateTime,
                    employeeID: currentUser.id,
                    lastchangedata: currentDateTime,
                    lastchangeby: currentUser.id,
                    comment: comment.trim(),
                };

                // В режиме GUID — ссылаемся на уже существующий картридж по его GUID.
                // В ручном режиме — как раньше, создаём новую партию по модели/количеству,
                // бэкенд сам сгенерирует GUID-ы.
                let requestData;
                if (operationType === 'ПРИЕМКА') {
                    if (item.mode === 'manual') {
                        // Новый картридж
                        requestData = {
                            ...baseData,
                            isdeflective: item.isdeflective,
                            model: item.model,
                            amount: parseInt(item.count) || 0,
                            guid: null,
                        };
                    } else {
                        // Приёмка существующего картриджа
                        requestData = {
                            ...baseData,
                            isdeflective: item.isdeflective,
                            model: null,
                            amount: null,
                            guid: item.guid,
                        };
                    }
                } else {
                    // Получение картриджа
                    requestData = {
                        ...baseData,
                        isdeflective: null,
                        model: null,
                        amount: null,
                        guid: item.guid,
                    };
                }

                console.log(`Отправляем в базу картридж:`, requestData);

                const response = await fetch('http://localhost:3000/requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `Ошибка при создании заявки для картриджа`);
                }

                // Проверяем только явный success: false — бэкенд может ответить 200,
                // но при этом ничего не создать (например, cartridgesAmount: 0).
                // Если поля success вообще нет в ответе (например, для GUID-режима),
                // считаем запрос успешным, раз response.ok уже это подтвердил.
                const result = await response.json().catch(() => ({}));

                if (result.success === false) {
                    throw new Error(
                        `Бэкенд не смог создать заявку${item.mode === 'manual' ? ` для модели ${item.model}` : ''} (cartridgesAmount: ${result.cartridgesAmount ?? 0})`
                    );
                }

                if (Array.isArray(result.GUIDs)) {
                    allGeneratedGuids = [...allGeneratedGuids, ...result.GUIDs];
                } else if (item.mode === 'guid') {
                    allGeneratedGuids = [...allGeneratedGuids, item.guid];
                }
                successfulCount++;
            }

            if (successfulCount > 0) {
                alert(
                    `Все заявки успешно созданы в PgAdmin!\n` +
                    `Всего обработано картриджей: ${successfulCount}\n\n` +
                    `GUID-ы/QR-коды для маркировки:\n` +
                    `${allGeneratedGuids.join('\n')}`
                );

                setCartridges([emptyRowForType(operationType)]);
                setComment('');
            }

        } catch (err) {
            const error = err as Error;
            console.error('Критическая ошибка в цикле отправки:', error);
            alert(`Процесс прерван из-за ошибки: ${error.message}`);
        }
    };

    if (isLoading) return <div className="flex min-h-screen items-center justify-center text-gray-500">Загрузка данных из БД...</div>;
    if (error) return <div className="flex min-h-screen items-center justify-center font-medium text-red-500">{error}</div>;

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans">
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
                        ПРИЕМКА
                    </button>
                    <button
                        type="button"
                        onClick={() => handleOperationTypeChange('ПОЛУЧЕНИЕ')}
                        className={`flex-1 py-2 text-xs font-bold tracking-wider transition-colors ${operationType === 'ПОЛУЧЕНИЕ' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
                    >
                        ПОЛУЧЕНИЕ
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
                                            title="Сканировать QR (скоро)"
                                            className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded border border-gray-300 bg-white text-sm font-bold text-gray-400"
                                        >
                                            QR
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
                                                        onChange={(e) => updateCartridge(index, 'guid', e.target.value)}
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
                                                onClick={() => updateCartridge(index, 'isdeflective', false)}
                                                className={`px-4 py-1.5 text-xs font-bold rounded border ${!item.isdeflective ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-gray-300'}`}
                                            >
                                                ДА
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateCartridge(index, 'isdeflective', true)}
                                                className={`px-4 py-1.5 text-xs font-bold rounded border ${item.isdeflective ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-gray-300'}`}
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

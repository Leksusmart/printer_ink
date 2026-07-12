'use client';

import { useState, useEffect } from 'react';
// Импортируем useSearchParams, чтобы прочитать телефон из адреса страницы
import { useSearchParams } from 'next/navigation';

interface CartridgeItem {
    model: string;
    count: string;
    isDefective: boolean;
}

// Описываем, как выглядит сотрудник в базе данных
interface Employer {
    id: number;
    phone: string;
    fullname: string;
    role: string;
}

export default function DashboardPage() {
    const searchParams = useSearchParams();
    // Читаем телефон из адреса сайта (например, ?phone=89008000010)
    const userPhone = searchParams.get('phone') || '';

    // 1. Храним реального сотрудника из БД здесь. По умолчанию — null (еще не загрузился)
    const [currentUser, setCurrentUser] = useState<Employer | null>(null);

    // 2. Храним реальный список моделей картриджей из БД здесь
    const [availableModels, setAvailableModels] = useState<string[]>([]);

    // Состояния формы заявки
    const [operationType, setOperationType] = useState<'ПРИЕМКА' | 'ПОЛУЧЕНИЕ'>('ПРИЕМКА');
    const [cartridges, setCartridges] = useState<CartridgeItem[]>([
        { model: '', count: '', isDefective: false }
    ]);
    const [comment, setComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // ПРОВЕРКА: Проверяем, заполнена ли форма
    // Метод .every() вернет true, только если абсолютно ВСЕ картриджи заполнены
    const isFormValid = cartridges.every(
        (item) => item.model.trim() !== '' && item.count.toString().trim() !== ''
    );

    // 🔄 ЭФФЕКТ: Функция useEffect срабатывает АВТОМАТИЧЕСКИ сразу при открытии этой страницы в браузере
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

                // --- ЗАПРОС 2: Получаем список моделей картриджей из БД ---
                const cartridgesResponse = await fetch('http://localhost:3000/cartridges');
                if (cartridgesResponse.ok) {
                    const cartridgesData = await cartridgesResponse.json();

                    // 1. Достаем все названия моделей (даже если они повторяются)
                    const allModels: string[] = cartridgesData.map((c: { model: string }) => c.model);

                    // 2. С помощью кунштюка Array.from(new Set(...)) удаляем все дубликаты!
                    const uniqueModels = Array.from(new Set(allModels));

                    // 3. Сохраняем в память фронтенда только уникальный список
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
    }, [userPhone]); // Эффект сработает заново, если телефон в адресе вдруг изменится

    const addCartridgeRow = () => {
        setCartridges([...cartridges, { model: '', count: '', isDefective: false }]);
    };

    // Доабавлена кнопка отмены выбора доп. картриджа
    const removeCartridgeRow = (indexToRemove: number) => {
        // Фильтруем массив: оставляем только те элементы, чей индекс (i) не равен indexToRemove
        const updated = cartridges.filter((_, i) => i !== indexToRemove);
        setCartridges(updated);
    };

    const updateCartridge = (index: number, key: keyof CartridgeItem, value: string | boolean) => {
        const updated = [...cartridges];
        updated[index] = { ...updated[index], [key]: value };
        setCartridges(updated);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!currentUser) {
            alert('Ошибка: Данные сотрудника еще не загрузились!');
            return;
        }

        // 1. Создаем пустой мешок, куда будем складывать ВСЕ сгенерированные GUID от бэкенда
        let allGeneratedGuids: string[] = [];
        let successfulCount = 0;

        const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

        try {
            // 2. ЗАПУСКАЕМ ЦИКЛ! Проходимся по каждому картриджу, который пользователь добавил на экран
            for (const item of cartridges) {
                // Если пользователь не выбрал модель в одной из строчек, просто пропускаем её
                if (!item.model.trim()) continue;

                // Упаковываем данные для ТЕКУЩЕГО картриджа в цикле
                const requestData = {
                    type: operationType === 'ПРИЕМКА' ? 'Приёмка' : 'Выдача',
                    isdeflective: item.isDefective, // Флаг брака конкретно для ЭТОЙ строки
                    status: 'Создана',
                    data: currentDateTime,
                    employee: currentUser.id,
                    lastchangedata: currentDateTime,
                    lastchangeby: currentUser.id,
                    comment: comment.trim(), // Комментарий один общий, вставляем его везде
                    model: item.model,       // Модель текущего картриджа
                    amount: parseInt(item.count) || 1 // Количество текущего картриджа
                };

                console.log(`Отправляем в базу картридж: ${item.model} (${item.count} шт.)`);

                // 3. Делаем POST-запрос строго для одной текущей модели
                const response = await fetch('http://localhost:3000/requests', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `Ошибка при создании заявки для модели ${item.model}`);
                }

                const result = await response.json();

                if (result.success && Array.isArray(result.GUIDs)) {
                    // 4. Склеиваем GUID-ы текущего картриджа с общим мешком
                    allGeneratedGuids = [...allGeneratedGuids, ...result.GUIDs];
                    successfulCount++;
                } else {
                    throw new Error(`Бэкенд вернул ошибку для модели ${item.model}`);
                }
            }

            // 5. КОНЕЦ ЦИКЛА. Если мы успешно отправили все заполненные строки
            if (successfulCount > 0) {
                alert(
                    `Все заявки успешно созданы в PgAdmin!\n` +
                    `Всего обработано типов картриджей: ${successfulCount}\n\n` +
                    `Сгенерированные QR-коды (GUID) для маркировки:\n` +
                    `${allGeneratedGuids.join('\n')}`
                );

                // Очищаем форму (оставляем только одну пустую строку)
                setCartridges([{ model: '', count: '', isDefective: false }]);
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

                <div>
                    <h1 className="text-xl font-normal text-gray-800">Заявка на картриджи</h1>
                    <p className="mt-1 text-sm text-gray-400">{"Заполните форму и нажмите \"Отправить\""}</p>
                </div>

                {/* Показываем ФИО РЕАЛЬНОГО человека, подтянутого из базы */}
                <div className="relative">
                    <select disabled className="w-full cursor-not-allowed appearance-none rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
                        <option>{currentUser ? currentUser.fullname : 'Загрузка сотрудника...'}</option>
                    </select>
                </div>

                <div className="flex overflow-hidden rounded border border-blue-500">
                    <button
                        type="button"
                        onClick={() => setOperationType('ПРИЕМКА')}
                        className={`flex-1 py-2 text-xs font-bold tracking-wider transition-colors ${operationType === 'ПРИЕМКА' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
                    >
                        ПРИЕМКА
                    </button>
                    <button
                        type="button"
                        onClick={() => setOperationType('ПОЛУЧЕНИЕ')}
                        className={`flex-1 py-2 text-xs font-bold tracking-wider transition-colors ${operationType === 'ПОЛУЧЕНИЕ' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
                    >
                        ПОЛУЧЕНИЕ
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {cartridges.map((item, index) => (
                        <div key={index} className="space-y-3 rounded border border-dashed border-gray-200 bg-gray-50/50 p-3">

                            <div className="flex gap-2">
                                <select
                                    value={item.model}
                                    onChange={(e) => updateCartridge(index, 'model', e.target.value)}
                                    required
                                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 bg-white"
                                >
                                    <option value="">Выберите картридж</option>
                                    {/* Сюда подставляются РЕАЛЬНЫЕ модели из базы данных */}
                                    {availableModels.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>

                                <button type="button" disabled className="flex cursor-not-allowed items-center justify-center rounded border border-blue-500 bg-white p-2 text-blue-500">
                                    <span className="text-lg">🔳</span>
                                </button>
                            </div>

                            <input
                                type="number"
                                placeholder="Введите количество картриджей"
                                value={item.count}
                                onChange={(e) => updateCartridge(index, 'count', e.target.value)}
                                required
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 placeholder-gray-400"
                            />

                            {/* Блок исправности: Текст + две кнопки рядом */}
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

                            {/* 🛠️ ДОБАВЛЯЕМ КНОПКУ УДАЛЕНИЯ СТРОКИ: */}
                            {/* cartridges.length > 1 означает: показываем кнопку только если строк больше одной */}
                            {cartridges.length > 1 && (
                                <div className="flex justify-end pt-1">
                                    <button
                                        type="button"
                                        onClick={() => removeCartridgeRow(index)}
                                        title="Удалить этот картридж"
                                        className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                                    >
                                        {/* Рисуем аккуратную красную мусорку с помощью SVG */}
                                        <svg
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                            className="h-5 w-5"
                                        >
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
                    {/* Кнопка отправки заявки, меняющая цвет в зависимости от заполнения полей */}
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
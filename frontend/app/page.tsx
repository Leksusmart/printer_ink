'use client';

import { useState } from 'react';
// 1. Импортируем инструмент для перехода между страницами
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [phone, setPhone] = useState('');
    // 2. Создаем состояние для отображения ошибки, если номера нет в базе
    const [error, setError] = useState('');
    // 3. Состояние загрузки, чтобы пользователь понимал, что запрос выполняется
    const [isLoading, setIsLoading] = useState(false);

    // Инициализируем маршрутизатор
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // Сбрасываем старую ошибку перед новым запросом
        setIsLoading(true); // Включаем режим загрузки

        try {
            // 4. Делаем запрос к контроллеру бэкенда (localhost:3000)
            // Мы передаем введенный телефон в параметры строки (?phone=...)
            const response = await fetch(`http://localhost:3000/Employers/search?phone=${encodeURIComponent(phone)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // 5. Если бэкенд ответил ошибкой (например, 404 Номер не найден)
            if (!response.ok) {
                // Пробуем прочитать текст ошибки от бэкенда
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Сотрудник с таким номером не найден');
            }

            // 6. Если всё хорошо, получаем данные пользователя
            const user = await response.json();
            console.log('Успешный вход! Данные сотрудника:', user);

            // Здесь можно сохранить данные (например, имя или роль) в локальную память, но пока просто переходим
            alert(`Добро пожаловать, ${user.fullname}!`);

            // 7. Перенаправляем пользователя на страницу /dashboard
            router.push('/dashboard');

        } catch (err: any) {
            // Если сработал throw new Error или бэкенд вообще выключен
            setError(err.message || 'Произошла ошибка при подключении к серверу');
        } finally {
            setIsLoading(false); // Выключаем режим загрузки в любом случае
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans">
            <form onSubmit={handleLogin} className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-8 shadow-md">
                <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
                    Вход в систему
                </h2>

                {/* 8. Блок для отображения ошибки, если она есть */}
                {error && (
                    <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="mb-5">
                    <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">
                        Номер телефона
                    </label>
                    <input
                        id="phone"
                        type="tel"
                        placeholder="89008000010" // Твой бэк ожидает такой формат в Query
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isLoading} // Блокируем поле во время запроса
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100"
                    />
                </div>

                {/* Изменяем текст кнопки в зависимости от того, идет ли загрузка */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-blue-700 disabled:bg-blue-400"
                >
                    {isLoading ? 'Проверка...' : 'Войти'}
                </button>
            </form>
        </div>
    );
}

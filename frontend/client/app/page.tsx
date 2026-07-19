'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const formatPhoneNumber = (value: string): string => {
    if (!value) return value;

    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;

    if (phoneNumberLength === 0) return '';

    let firstDigit = '+7';
    if (phoneNumber[0] === '8') firstDigit = '+7';

    if (phoneNumberLength <= 1) {
        return firstDigit;
    }
    if (phoneNumberLength <= 4) {
        return `${firstDigit} (${phoneNumber.slice(1)}`;
    }
    if (phoneNumberLength <= 7) {
        return `${firstDigit} (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4)}`;
    }
    if (phoneNumberLength <= 9) {
        return `${firstDigit} (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7)}`;
    }
    return `${firstDigit} (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 9)}-${phoneNumber.slice(9, 11)}`;
};

export default function LoginPage() {
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Инициализируем маршрутизатор
    const router = useRouter();

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedValue = formatPhoneNumber(e.target.value);
        setPhone(formattedValue);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (phone.length < 18) {
            setError('Ошибка: Введите полный номер телефона');
            return;
        }

        setError('');
        setIsLoading(true);

        const cleanPhone = '+7' + phone.replace(/[^\d]/g, '').slice(1);

        try {
            // Отправляем POST запрос на эндпоинт авторизации клиента
            const response = await fetch(`${process.env.CLIENT_URL}:${process.env.PORT_BACKEND}/employers/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanPhone }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.message || 'Сотрудник с таким номером не найден или ошибка связи');
            }

            localStorage.setItem('client_session', JSON.stringify(data));

            router.push('/dashboard');

        } catch (err) {
            const error = err as Error;
            setError(error.message || 'Произошла неизвестная ошибка');
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
                        placeholder="+7 (999) 999-99-99"
                        value={phone}
                        onChange={handlePhoneChange}
                        maxLength={18}
                        required
                        disabled={isLoading}
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

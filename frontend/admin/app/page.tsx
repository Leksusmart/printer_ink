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

export default function AdminLoginPage() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
            // Отправляем POST запрос на эндпоинт авторизации админа
            const response = await fetch(`${process.env.CLIENT_URL}:${process.env.PORT_BACKEND}/employers/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: cleanPhone,
                    password: password
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Ошибка связи');
            }

            const data = await response.json();

            // Сохраняем токен или роль администратора, чтобы защитить другие страницы
            localStorage.setItem('admin_session', JSON.stringify(data));

            // Перенаправляем на дашборд админки
            router.push('/dashboard');

        } catch (err) {
            const error = err as Error;
            setError(error.message || 'Произошла неизвестная ошибка');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans">
            <form onSubmit={handleLogin} className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-2xl">
                <h2 className="mb-2 text-center text-2xl font-bold text-white">
                    Printer Ink
                </h2>
                <p className="mb-6 text-center text-sm text-slate-400">
                    Панель администратора
                </p>

                {error && (
                    <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* Поле Телефона */}
                <div className="mb-4">
                    <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-300">
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
                        className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-slate-800 disabled:text-slate-500"
                    />
                </div>

                {/* Новое поле Пароля */}
                <div className="mb-6">
                    <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
                        Пароль
                    </label>
                    <input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                        className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-slate-800 disabled:text-slate-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-blue-700 disabled:bg-blue-800 disabled:text-slate-400"
                >
                    {isLoading ? 'Проверка прав...' : 'Войти в панель'}
                </button>
            </form>
        </div>
    );
}

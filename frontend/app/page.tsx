'use client';

import { useState } from 'react';

export default function LoginPage() {
    const [phone, setPhone] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Отправка на бэкенд:', phone);
        alert(`Телефон записан: ${phone}`);
    };

    return (
        // bg-gray-50 делает задний фон светло-серым, а h-screen растягивает экран на всю высоту
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans">

            {/* bg-white — белый фон формы, shadow-md — мягкая тень, rounded-xl — скругленные углы */}
            <form onSubmit={handleLogin} className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-8 shadow-md">

                {/* Заголовок: text-2xl (крупный), font-bold (жирный), text-gray-800 (темно-серый цвет) */}
                <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
                    Вход в систему
                </h2>

                <div className="mb-5">
                    {/* text-sm (мелкий шрифт), font-medium (средняя жирность) */}
                    <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">
                        Номер телефона
                    </label>

                    {/* border-gray-300 — серая рамка, focus:ring-2 — синее свечение при нажатии */}
                    <input
                        id="phone"
                        type="tel"
                        placeholder="+7 (999) 999-99-99"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                </div>

                {/* bg-blue-600 — синяя кнопка, hover:bg-blue-700 — темнеет при наведении мышкой */}
                <button
                    type="submit"
                    className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-blue-700"
                >
                    Войти
                </button>
            </form>

        </div>
    );
}

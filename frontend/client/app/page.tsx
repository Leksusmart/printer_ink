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
            const response = await fetch(`${process.env.CLIENT_URL}:${process.env.PORT_BACKEND}/employers/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanPhone }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.message || 'Сотрудник с таким номером не найден или ошибка связи');
            }

            localStorage.removeItem('client_session');
            localStorage.removeItem('admin_session');

            if (data.password ?? false) {
                localStorage.setItem('admin_session', JSON.stringify(data));
            } else {
                localStorage.setItem('client_session', JSON.stringify(data));
            }

            router.push('/dashboard');

        } catch (err) {
            const error = err as Error;
            setError(error.message || 'Произошла неизвестная ошибка');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#e8e8ed] p-6 font-sans">
            {/* Декоративные мелкие кляксы (как будто капли упали рядом) */}
            <div className="ink-splat absolute top-[18%] left-[15%] h-32 w-32 rotate-[-12deg] rounded-[40%_60%_55%_45%_/_35%_50%_70%_30%] bg-black/90 shadow-xl" />
            <div className="ink-splat absolute top-[25%] right-[18%] h-20 w-20 rotate-[25deg] rounded-[70%_30%_45%_55%_/_60%_40%_35%_65%] bg-black/90 shadow-lg" />
            <div className="ink-splat absolute bottom-[22%] left-[22%] h-16 w-16 rotate-[-35deg] rounded-[35%_65%_80%_20%_/_50%_30%_60%_40%] bg-black/80 shadow-md" />

            <form
                onSubmit={handleLogin}
                className="ink-klyaksa relative z-10 w-full max-w-md px-11 py-16 text-white shadow-2xl"
            >
                <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight text-white">
                    Вход в систему
                </h2>

                {error && (
                    <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-center text-sm text-red-200">
                        {error}
                    </div>
                )}

                <div className="mb-8">
                    <label htmlFor="phone" className="mb-3 block text-sm font-medium text-white/85">
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
                        className="w-full rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-lg text-white placeholder-white/50 transition-all outline-none focus:border-white/40 focus:ring-2 focus:ring-white/30 disabled:opacity-50"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r w-full rounded-2xl from-zinc-950 to-black px-6 py-4 font-semibold text-white shadow-xl transition-all duration-300 hover:brightness-110 disabled:opacity-70"
                >
                    {isLoading ? 'Проверка...' : 'Войти'}
                </button>
            </form>

            <style jsx>{`
                .ink-klyaksa {
                    background: linear-gradient(145deg, #0c0c0c 0%, #1a1a1a 100%);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 58% 42% 65% 35% / 45% 55% 40% 60%;
                    box-shadow: 
                        0 25px 60px -15px rgba(0, 0, 0, 0.45),
                        inset 0 10px 30px rgba(255,255,255,0.05);
                }

                .ink-splat {
                    filter: blur(1px);
                    opacity: 0.95;
                }

                @media (prefers-reduced-motion: reduce) {
                    .ink-klyaksa, .ink-splat { animation: none; }
                }
            `}</style>
        </div>
    );
}
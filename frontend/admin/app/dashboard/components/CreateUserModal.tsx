'use client';

import { useState } from 'react';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

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
export default function CreateUserModal({ isOpen, onClose, onSuccess }: UserModalProps) {
    const [fullname, setFullname] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('User');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedValue = formatPhoneNumber(e.target.value);
        setPhone(formattedValue);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanFullname = fullname.trim().replace(/\s+/g, ' ');
        const words = cleanFullname ? cleanFullname.split(' ') : [];
        if (words.length !== 3) {
            setMessage('Ошибка: Введите полные ФИО (Фамилия Имя Отчество)');
            return;
        }
        const nameRegex = /^[-\p{L}]+ [-\p{L}]+ [-\p{L}]+$/u;
        if (!nameRegex.test(cleanFullname)) {
            setMessage('Ошибка: ФИО должно содержать только буквы');
            return;
        }
        const formattedFullname = words
            .map(word =>
                word
                    .split('-')
                    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
                    .join('-')
            )
            .join(' ');

        if (phone.length < 18) {
            setMessage('Ошибка: Введите полный номер телефона');
            return;
        }

        const cleanPhone = '+7' + phone.replace(/[^\d]/g, '').slice(1);

        setLoading(true);
        setMessage('');

        try {
            const res = await fetch(`${process.env.CLIENT_URL}:${process.env.PORT_BACKEND}/admin/create-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullname: formattedFullname, phone: cleanPhone, role, password })
            });

            if (res.ok) {
                setMessage('Пользователь создан!');
                setFullname(''); setPhone(''); setPassword('');
                onSuccess();
                setTimeout(onClose, 1500);
            } else {
                throw new Error('Ошибка создания');
            }
        } catch (err) {
            setMessage('Ошибка: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white p-8 rounded-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-6">Новый пользователь</h2>

                {message && <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded">{message}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="ФИО" value={fullname} onChange={e => setFullname(e.target.value)} required className="w-full border p-3 rounded" />
                    <input
                        type="tel"
                        placeholder="+7 (999) 999-99-99"
                        value={phone}
                        onChange={handlePhoneChange}
                        maxLength={18}
                        required
                        className="w-full border p-3 rounded"
                    />

                    <select value={role} onChange={e => setRole(e.target.value)} className="w-full border p-3 rounded">
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                    </select>

                    {role === 'Admin' && (
                        <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border p-3 rounded" />
                    )}

                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 border rounded">Отмена</button>
                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded">
                            {loading ? 'Создание...' : 'Создать'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
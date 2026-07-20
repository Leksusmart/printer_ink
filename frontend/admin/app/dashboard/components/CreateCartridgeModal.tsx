'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CartridgeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateCartridgeModal({ isOpen, onClose, onSuccess }: CartridgeModalProps) {
    const router = useRouter();

    const [model, setModel] = useState('');
    const [amount, setAmount] = useState(1);
    const [status, setStatus] = useState('Ожидает заправки');
    const [isDefective, setIsDefective] = useState(false);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [isCreatedCartridgesQR, setIsCreatedCartridgesQR] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return !!sessionStorage.getItem('generatedCartridges');
        }
        return false;
    });
    useEffect(() => {
        const saved = sessionStorage.getItem('generatedCartridges');
        setIsCreatedCartridgesQR(!!saved);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !model) return;

        setLoading(true);
        setMessage('');

        try {
            // Получаем текущего админа из сессии
            const sessionStr = localStorage.getItem('admin_session');
            const session = sessionStr ? JSON.parse(sessionStr) : null;
            const adminId = session?.id || null;


            const res = await fetch(`${process.env.CLIENT_URL}:${process.env.PORT_BACKEND}/requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'Регистрация',
                    isDefective: isDefective,
                    status: status,
                    EmployeeID: adminId,
                    comment: comment,
                    newCartridges: {
                        model: model,
                        amount: amount
                    }
                })
            });
            const result = await res.json();

            if (!result.success) {
                throw new Error(`Ошибка сервера`);
            }

            if (res.ok) {
                let manuallyCreatedCartridges: { guid: string; model: string; isDefective: boolean }[] = [];

                setMessage('Картриджи успешно добавлены!');
                onSuccess();
                setModel('');
                setIsDefective(false)
                setStatus('Ожидает заправки');
                setAmount(1);
                setComment('');
                setTimeout(() => {
                    setMessage('');
                    // Редирект на QR-коды, если создавались новые картриджи
                    sessionStorage.removeItem('generatedCartridges');
                    sessionStorage.setItem('generatedCartridges', JSON.stringify(manuallyCreatedCartridges));
                    router.push(`/dashboard/pages/cartridgesQR`);
                }, 1500);
                if (Array.isArray(result.GUIDs) && result.GUIDs.length > 0) {
                    for (let guidIndex = 0; guidIndex < amount; guidIndex++) {
                        if (result.GUIDs[guidIndex]) {
                            manuallyCreatedCartridges.push({
                                guid: result.GUIDs[guidIndex],
                                model: model,
                                isDefective: isDefective
                            });
                        }
                    }
                }
            } else {
                const errorText = await res.text();
                throw new Error(errorText || 'Ошибка создания');
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
                {isCreatedCartridgesQR && (
                    <button
                        type="button"
                        onClick={() => router.push('/dashboard/pages/cartridgesQR')}
                        className="text-xs text-gray-400 hover:text-red-500 font-medium tracking-wide uppercase transition-colors duration-200 flex items-center gap-1"
                    >
                        Посмотреть созданные QR →
                    </button>
                )}
                <h2 className="text-xl font-bold mb-6">Добавить новый картридж</h2>

                {message && <div className={`mb-4 p-3 rounded ${message.includes('успешно') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1">Модель</label>
                        <input type="text" value={model} onChange={e => setModel(e.target.value)} required className="w-full border p-3 rounded" placeholder="Например: HP 59A" />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Количество</label>
                        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} required className="w-full border p-3 rounded" placeholder="" />
                    </div>

                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={isDefective} onChange={e => setIsDefective(e.target.checked)} />
                        Пометить как неисправные
                    </label>
                    <div>
                        <label className="block text-sm mb-1">Cтатус</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border p-3 rounded">
                            {isDefective ? (
                                <>
                                    <option value="Ожидает ремонта">Ожидает ремонта</option>
                                    <option value="Списан">Списан</option>
                                </>
                            ) : (
                                <>
                                    <option value="Ожидает заправки">Ожидает заправки</option>
                                    <option value="Готов к выдаче">Готов к выдаче</option>
                                    <option value="Выдан">Выдан</option>
                                </>
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Комментарий</label>
                        <input type="text" value={comment} onChange={e => setComment(e.target.value)} maxLength={100} className="w-full border p-3 rounded" />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 border rounded">Отмена</button>
                        <button type="submit" disabled={loading || !model} className="flex-1 py-3 bg-gray-700 text-white rounded">
                            {loading ? 'Добавление...' : 'Добавить картридж'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
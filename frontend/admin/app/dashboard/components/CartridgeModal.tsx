'use client';

import { useState, useEffect } from 'react';

interface CartridgeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CartridgeModal({ isOpen, onClose, onSuccess }: CartridgeModalProps) {
    const [model, setModel] = useState('');
    const [guid, setGuid] = useState('');
    const [status, setStatus] = useState('Ожидает заправки');
    const [isDefective, setIsDefective] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [generating, setGenerating] = useState(false);

    // Автогенерация GUID при открытии
    useEffect(() => {
        if (isOpen) {
            generateNewGuid();
        }
    }, [isOpen]);

    const generateNewGuid = async () => {
        setGenerating(true);
        try {
            const res = await fetch('http://localhost:3000/admin/generate-guid');
            const data = await res.json();
            setGuid(data.guid);
        } catch (err) {
            setMessage('Не удалось сгенерировать GUID');
        } finally {
            setGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!guid || !model) return;

        setLoading(true);
        setMessage('');

        try {
            // Получаем текущего админа из сессии
            const sessionStr = localStorage.getItem('admin_session');
            const session = sessionStr ? JSON.parse(sessionStr) : null;
            const adminId = session?.id || null;

            const res = await fetch('http://localhost:3000/admin/create-cartridge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    guid,
                    status,
                    isdefective: isDefective,
                    adminId: adminId
                })
            });

            if (res.ok) {
                setMessage('Картридж успешно добавлен!');
                onSuccess();
                setModel('');
                setGuid('');
                setTimeout(() => {
                    setMessage('');
                }, 1500);
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
                <h2 className="text-xl font-bold mb-6">Добавить новый картридж</h2>

                {message && <div className={`mb-4 p-3 rounded ${message.includes('успешно') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1">Модель</label>
                        <input type="text" value={model} onChange={e => setModel(e.target.value)} required className="w-full border p-3 rounded" placeholder="Например: HP 59A" />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">GUID</label>
                        <div className="flex gap-2">
                            <input type="text" value={guid} readOnly className="flex-1 border p-3 rounded bg-gray-50" />
                            <button type="button" onClick={generateNewGuid} disabled={generating} className="px-4 border rounded hover:bg-gray-100">🔄</button>
                        </div>
                    </div>

                    {/* Флаг дефекта (Брак) */}
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={isDefective} onChange={e => setIsDefective(e.target.checked)} />
                        Пометить как неисправный
                    </label>
                    {/* Динамический выбор статуса в зависимости от флага брака */}
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
'use client';

import { useState, useEffect } from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function SettingsModal({ isOpen, onClose, onSuccess }: SettingsModalProps) {
    const [refillthreshold, setrefillthreshold] = useState(10);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (isOpen) loadSettings();
    }, [isOpen]);

    const loadSettings = async () => {
        try {
            const res = await fetch(`${process.env.CLIENT_URL}:${process.env.PORT_BACKEND}/employers/admin-login`);
            if (res.ok) {
                const data = await res.json();
                setrefillthreshold(data.refillthreshold ?? 10);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const res = await fetch(`${process.env.CLIENT_URL}:${process.env.PORT_BACKEND}/admin/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    refillthreshold
                })
            });

            if (res.ok) {
                setMessage('✅ Настройки сохранены!');
                onSuccess();
                setTimeout(() => {
                    onClose();
                    window.location.reload();   // ← Полное обновление страницы
                }, 1000);
            } else {
                throw new Error('Ошибка сохранения');
            }
        } catch (err) {
            setMessage('❌ Ошибка: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Настройки</h2>
                    <button onClick={onClose} className="text-3xl text-gray-400 hover:text-gray-600">×</button>
                </div>

                {message && <div className="mb-6 p-4 rounded-xl bg-blue-50 text-blue-700">{message}</div>}

                <form onSubmit={handleSubmit}>                    
                    <div className="mt-8 flex items-center justify-between border-t pt-6">
                        <label className="font-medium">Порог для заявки на заправку включительно:</label>
                        <input
                            type="number"
                            value={refillthreshold}
                            onChange={(e) => setrefillthreshold(Number(e.target.value))}
                            className="w-24 text-center border rounded-lg px-4 py-2 text-lg font-semibold"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl text-lg transition"
                    >
                        {loading ? 'Сохранение...' : 'СОХРАНИТЬ НАСТРОЙКИ'}
                    </button>
                </form>
            </div>
        </div>
    );
}
'use client';

import { useState, useEffect } from 'react';

interface DeleteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface FoundUser {
    id: number | string;
    fullname: string;
    role: string
    phone: string;
}

export default function DeleteUserModal({ isOpen, onClose, onSuccess }: DeleteUserModalProps) {
    const [allUsers, setAllUsers] = useState<FoundUser[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [fetchingUsers, setFetchingUsers] = useState(false);
    const [message, setMessage] = useState('');

    const [showTransferPrompt, setShowTransferPrompt] = useState(false);
    const [currentAdminId, setCurrentAdminId] = useState<number | string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const session = localStorage.getItem('admin_session');
            if (session) {
                try {
                    const parsed = JSON.parse(session);
                    if (parsed && parsed.id) setCurrentAdminId(parsed.id);
                } catch (e) {
                    console.error('Ошибка парсинга сессии админа', e);
                }
            }
        }
    }, [isOpen]);

    // Загружаем всех пользователей
    useEffect(() => {
        if (!isOpen) return;

        const loadUsers = async () => {
            setFetchingUsers(true);
            try {
                const res = await fetch(`${process.env.CLIENT_URL}:${process.env.PORT_BACKEND}/employers`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (res.ok) {
                    const data = await res.json();
                    const usersList = Array.isArray(data) ? data : [];
                    const sortedUsers = usersList.sort((a, b) =>
                        a.fullname.localeCompare(b.fullname, 'ru')
                    );
                    setAllUsers(sortedUsers);
                } else {
                    setMessage('Ошибка: Не удалось загрузить список пользователей');
                }
            } catch (err) {
                setMessage('Ошибка сети при загрузке списка пользователей');
            } finally {
                setFetchingUsers(false);
            }
        };

        loadUsers();
    }, [isOpen]);

    const handleDelete = async (e: React.FormEvent, isForceApproval: boolean = false) => {
        if (e) e.preventDefault();

        if (!selectedUserId) {
            setMessage('Ошибка: Пожалуйста, выберите пользователя');
            return;
        }

        if (!currentAdminId) {
            setMessage('Ошибка: Не удалось определить ваш ID администратора. Перезагрузите страницу.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const res = await fetch(`${process.env.CLIENT_URL}:${process.env.PORT_BACKEND}/admin/delete-user`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identifier: selectedUserId,
                    adminId: currentAdminId,
                    force: isForceApproval // отправляем true, если админ согласился переписать данные на себя
                })
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                // Если бэкенд вернул флаг переноса ответственности (статус успешный, но действие не завершено)
                if (data.requiresTransfer) {
                    setShowTransferPrompt(true);
                    setMessage('Ошибка: ' + data.message);
                } else {
                    // Успешное окончательное удаление
                    setMessage(data.message || 'Пользователь успешно удален!');
                    setSelectedUserId('');
                    setShowTransferPrompt(false);
                    onSuccess();
                }
            } else {
                throw new Error(data.message || 'Ошибка при удалении');
            }
        } catch (err) {
            setMessage('Ошибка: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleCloseModal = () => {
        setSelectedUserId('');
        setAllUsers([]);
        setMessage('');
        setShowTransferPrompt(false);
        onClose();
    };

    const selectedUser = allUsers.find(user => String(user.id) === selectedUserId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white p-8 rounded-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-red-600">Удаление пользователя</h2>

                {message && (
                    <div className={`mb-4 p-3 rounded bg-blue-50 text-blue-700`}>
                        {message}
                    </div>
                )}

                {/* Обычный режим выбора */}
                {!showTransferPrompt && (
                    <>
                        <p className="mb-4 text-sm text-gray-600">
                            Выберите пользователя из списка системы для его удаления.
                        </p>

                        <form onSubmit={(e) => handleDelete(e, false)} className="space-y-4">
                            <select
                                value={selectedUserId}
                                onChange={(e) => {
                                    setSelectedUserId(e.target.value);
                                    setMessage('');
                                }}
                                required
                                disabled={loading || fetchingUsers}
                                className="w-full border p-3 rounded bg-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                            >
                                <option value="" disabled>
                                    {fetchingUsers ? 'Загрузка списка...' : '— Выберите пользователя —'}
                                </option>
                                {allUsers.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.fullname} ({user.phone})
                                    </option>
                                ))}
                            </select>

                            {selectedUser && (
                                <div className="p-4 bg-red-50/50 border border-red-200 rounded-lg text-sm">
                                    <span className="text-gray-500 block mb-1">Будет удален:</span>
                                    <div className="font-semibold text-gray-800 text-base">{selectedUser.fullname}</div>
                                    <div className="text-gray-600 mt-0.5">Роль: {selectedUser.role}</div>
                                    <div className="text-gray-600 mt-0.5">Телефон: {selectedUser.phone}</div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={handleCloseModal} disabled={loading} className="flex-1 py-3 border rounded hover:bg-gray-50 transition">
                                    Отмена
                                </button>
                                <button type="submit" disabled={loading || !selectedUserId} className="flex-1 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:bg-gray-200">
                                    {loading ? 'Проверка...' : 'Удалить'}
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {/* Интерактивный режим подтверждения переноса ответственности */}
                {showTransferPrompt && (
                    <div className="space-y-4 animate-fadeIn">
                        <p className="text-sm text-gray-700 leading-relaxed">
                            Вы можете <strong>принять на себя всю ответственность</strong> за картриджи и заявки, связанные с пользователем <strong className="text-gray-900">{selectedUser?.fullname}</strong>.
                        </p>
                        <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded border border-amber-100">
                            Все заявки и картриджи, созданные этим пользователем будут перезаписаны на ваш аккаунт, после чего профиль этого сотрудника будет удалён.
                        </p>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                disabled={loading}
                                className="flex-1 py-3 border rounded hover:bg-gray-50 transition"
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                onClick={(e) => handleDelete(e, true)}
                                disabled={loading}
                                className="flex-1 py-3 bg-amber-600 text-white rounded hover:bg-amber-700 transition font-medium"
                            >
                                {loading ? 'Перенос и удаление...' : 'Принять и удалить'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

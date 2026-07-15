'use client';

import { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SettingsModal({ isOpen, onClose, onSuccess }: SettingsModalProps) {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:3000/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('http://localhost:3000/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        setMessage('Настройки сохранены!');
        onSuccess();
        setTimeout(onClose, 1500);
      } else {
        throw new Error('Ошибка сохранения');
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
        <h2 className="text-xl font-bold mb-6">Настройки системы</h2>

        {message && <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Здесь можно добавить поля настроек по мере необходимости */}
          <div className="text-sm text-gray-500 italic">
            Настройки пока минимальные. Можно расширить позже.
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 border rounded">Отмена</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-slate-700 text-white rounded">
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
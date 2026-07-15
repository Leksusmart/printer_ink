'use client';

import { useState } from 'react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('http://localhost:3000/admin/create-cartridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, guid, status, isdefective: isDefective })
      });

      if (res.ok) {
        setMessage('Картридж успешно добавлен!');
        setModel(''); setGuid('');
        onSuccess();
        setTimeout(onClose, 1500);
      } else {
        throw new Error('Ошибка при создании картриджа');
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
          <input 
            type="text" 
            placeholder="Модель картриджа" 
            value={model} 
            onChange={e => setModel(e.target.value)} 
            required 
            className="w-full border p-3 rounded" 
          />
          <input 
            type="text" 
            placeholder="GUID" 
            value={guid} 
            onChange={e => setGuid(e.target.value)} 
            required 
            className="w-full border p-3 rounded" 
          />

          <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border p-3 rounded">
            <option value="Ожидает заправки">Ожидает заправки</option>
            <option value="Заправлен">Заправлен</option>
            <option value="В ремонте">В ремонте</option>
          </select>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isDefective} onChange={e => setIsDefective(e.target.checked)} />
            Бракованный
          </label>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 border rounded">Отмена</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-gray-700 text-white rounded">
              {loading ? 'Добавление...' : 'Добавить картридж'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';

interface ScrapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ScrapModal({ isOpen, onClose, onSuccess }: ScrapModalProps) {
  const [guid, setGuid] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('http://localhost:3000/admin/scrap-cartridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guid })
      });

      if (res.ok) {
        setMessage('Картридж успешно списан!');
        setGuid('');
        onSuccess();
        setTimeout(onClose, 1500);
      } else {
        throw new Error('Не удалось списать картридж');
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
        <h2 className="text-xl font-bold mb-6 text-red-600">Списание картриджа</h2>

        {message && <div className={`mb-4 p-3 rounded ${message.includes('успешно') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder="GUID картриджа для списания" 
            value={guid} 
            onChange={e => setGuid(e.target.value)} 
            required 
            className="w-full border p-3 rounded" 
          />

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 border rounded">Отмена</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-red-600 text-white rounded">
              {loading ? 'Списание...' : 'Списать картридж'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
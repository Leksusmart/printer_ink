'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '../api/adminApi';

import DashboardStats from './components/DashboardStats';
import UserModal from './components/UserModal';
import CartridgeModal from './components/CartridgeModal';
import ScrapModal from './components/ScrapModal';
import SettingsModal from './components/SettingsModal';
import RequestsTable from './components/RequestsTable';

export default function DashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isCartridgeModalOpen, setIsCartridgeModalOpen] = useState(false);
  const [isScrapModalOpen, setIsScrapModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const [stats, setStats] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [refillData, setRefillData] = useState<any[]>([]);
  const [repairData, setRepairData] = useState<any[]>([]);

  const fetchAllData = async () => {
    try {
      const [statsData, history, refill, repair] = await Promise.all([
        adminApi.getStats(),
        adminApi.getHistory(),
        adminApi.getRefillRequests(),
        adminApi.getRepairRequests()
      ]);

      setStats(statsData);
      setHistoryData(history || []);
      setRefillData(refill || []);
      setRepairData(repair || []);
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
    }
  };

  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (!session) {
      router.push('/'); // или /login
      return;
    }

    try {
      const user = JSON.parse(session);
      if (user.role !== 'Admin') {
        router.push('/');
      } else {
        setAdmin(user);
        fetchAllData();
      }
    } catch (e) {
      router.push('/');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Админ-панель</h1>
          {admin && <p className="text-gray-600">Добро пожаловать, {admin.fullname}</p>}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsUserModalOpen(true)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Новый пользователь</button>
          <button onClick={() => setIsCartridgeModalOpen(true)} className="px-5 py-2.5 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-medium">Новый картридж</button>
          <button onClick={() => setIsScrapModalOpen(true)} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">Списать картридж</button>
          <button onClick={() => setIsSettingsModalOpen(true)} className="px-5 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium">Настройки</button>
        </div>
      </div>

      <DashboardStats stats={stats} />

      <div className="space-y-8 mt-8">
        <RequestsTable title="📋 Все заявки" data={historyData} />
        <RequestsTable title="⚡ На заправку" data={refillData} />
        <RequestsTable title="🛠️ На ремонт" data={repairData} />
      </div>

      <UserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSuccess={fetchAllData} />
      <CartridgeModal isOpen={isCartridgeModalOpen} onClose={() => setIsCartridgeModalOpen(false)} onSuccess={fetchAllData} />
      <ScrapModal isOpen={isScrapModalOpen} onClose={() => setIsScrapModalOpen(false)} onSuccess={fetchAllData} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} onSuccess={fetchAllData} />
    </div>
  );
}
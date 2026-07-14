const API_BASE = 'http://localhost:3000/admin';

export const adminApi = {
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Ошибка загрузки статистики');
    return res.json();
  },

  async getHistory() {
    const res = await fetch(`${API_BASE}/history`);
    if (!res.ok) throw new Error('Ошибка загрузки истории');
    return res.json();
  },

  async getRefillRequests() {
    const res = await fetch(`${API_BASE}/refill`);
    if (!res.ok) throw new Error('Ошибка загрузки заявок на заправку');
    return res.json();
  },

  async getRepairRequests() {
    const res = await fetch(`${API_BASE}/repair`);
    if (!res.ok) throw new Error('Ошибка загрузки заявок на ремонт');
    return res.json();
  },

  async getSettings() {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Ошибка загрузки настроек');
    return res.json();
  },

  async updateSettings(settings: any) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Ошибка сохранения настроек');
    return res.json();
  },

  async createUser(data: any) {
    const res = await fetch('http://localhost:3000/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Ошибка создания пользователя');
    return res.json();
  },

  async createCartridge(data: any) {
    const res = await fetch('http://localhost:3000/admin/create-cartridge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Ошибка создания картриджа');
    return res.json();
  },

  async scrapCartridge(guid: string) {
    const res = await fetch('http://localhost:3000/admin/scrap-cartridge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guid })
    });
    if (!res.ok) throw new Error('Ошибка списания картриджа');
    return res.json();
  }
};
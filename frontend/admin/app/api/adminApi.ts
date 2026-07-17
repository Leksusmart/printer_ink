const API_BASE = `${process.env.CLIENT_URL}:${process.env.PORT_BACKEND}/admin`;

export const adminApi = {
    async getStats() {
        const res = await fetch(`${API_BASE}/stats`);
        if (!res.ok) throw new Error('Ошибка загрузки статистики');
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
        const res = await fetch(`${API_BASE}/create-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Ошибка создания пользователя');
        return res.json();
    },

    async createCartridge(data: any) {
        const res = await fetch(`${API_BASE}/create-cartridge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Ошибка создания картриджа');
        return res.json();
    },

    async scrapCartridge(guid: string) {
        const res = await fetch(`${API_BASE}/scrap-cartridge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guid })
        });
        if (!res.ok) throw new Error('Ошибка списания картриджа');
        return res.json();
    },

    async getHistory() {
        const res = await fetch(`${API_BASE}/history`);
        if (!res.ok) throw new Error('Ошибка загрузки истории');
        return res.json();
    },

    async getRefillRepairRequests() {
        const res = await fetch(`${API_BASE}/refill-repair`);
        if (!res.ok) throw new Error('Ошибка загрузки заявок на заправку/ремонт');
        return res.json();
    },

    async getReceivingRequests() {
        const res = await fetch(`${API_BASE}/receiving`);
        if (!res.ok) throw new Error('Ошибка загрузки заявок на приёмку');
        return res.json();
    },

    async getScrapRequests() {
        const res = await fetch(`${API_BASE}/scrap-requests`);
        if (!res.ok) throw new Error('Ошибка загрузки заявок на списание');
        return res.json();
    },

    async getIssuanceRequests() {
        const res = await fetch(`${API_BASE}/issuance`);
        if (!res.ok) throw new Error('Ошибка загрузки заявок на получение');
        return res.json();
    },

    async getCartridgesForRequest(requestId: number) {
        const res = await fetch(`${API_BASE}/request/${requestId}/cartridges`);
        if (!res.ok) throw new Error('Ошибка загрузки картриджей заявки');
        return res.json();
    },
};
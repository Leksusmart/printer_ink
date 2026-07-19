const API_BASE = `${process.env.CLIENT_URL}:${process.env.PORT_BACKEND}/admin`;
const ROOT_API_BASE = `${process.env.CLIENT_URL}:${process.env.PORT_BACKEND}`;

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

    async changeCartridgeStatus(guid: string, status: string, adminId: number, comment?: string) {
        const res = await fetch(`${API_BASE}/change-cartridge-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guid, status, adminId, comment })
        });
        if (!res.ok) throw new Error('Ошибка изменения статуса картриджа');
        return res.json();
    },

    async getRequests() {
        const res = await fetch(`${API_BASE}/requests`);
        if (!res.ok) throw new Error('Ошибка загрузки заявок');
        return res.json();
    },

    async getCartridges() {
        const res = await fetch(`${API_BASE}/cartridges`);
        if (!res.ok) throw new Error('Ошибка загрузки картриджей');
        return res.json();
    },

    async getEmployers() {
        const res = await fetch(`${API_BASE}/employers`);
        if (!res.ok) throw new Error('Ошибка загрузки сотрудников');
        return res.json();
    },

    async getRequestsByGuid(guid: string) {
        const res = await fetch(`${ROOT_API_BASE}/requests/history?guid=${encodeURIComponent(guid)}`);
        if (!res.ok) throw new Error('Ошибка загрузки заявок по картриджу');
        return res.json();
    },

    async getCartridgesForRequest(requestId: number) {
        const res = await fetch(`${API_BASE}/request/${requestId}/cartridges`);
        if (!res.ok) throw new Error('Ошибка загрузки картриджей заявки');
        return res.json();
    },
};
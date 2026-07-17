import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CartridgesService } from '../cartridges/cartridges.service';

export interface Request {
    id: number;
    type: string;
    isdefective: boolean;
    status: string;
    data: Date;
    employee: number;
    lastchangedata: Date;
    lastchangeby: number;
    comment: string;
}

@Injectable()
export class RequestsService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly cartridgesService: CartridgesService,
    ) { }

    async findAll(): Promise<Request[]> {
        const result = await this.databaseService.query(`
      SELECT *
      FROM public.requests
      ORDER BY data DESC
    `);
        return result.rows;
    }

    async findRequestByGuid(guid: string): Promise<Request | null> {
        const cartridge = await this.cartridgesService.findByGuid(guid);
        if (!cartridge) return null;

        const result = await this.databaseService.query(`
      SELECT r.*
      FROM public.requests r
      JOIN public.requestslist rl ON r.id = rl.requestid
      WHERE rl.cartridgeid = $1
    `, [cartridge.id]);

        if (result.rows.length === 0) return null;

        return result.rows[0];
    }

    async createRequest(data: any): Promise<{ success: boolean; cartridgesAmount: number; GUIDs: string[] }> {
        try {
            const moscowDateTime = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
            const [datePart, timePart] = moscowDateTime.split(', ');
            const [day, month, year] = datePart.split('.');
            const currentDateTime = `${year}-${month}-${day} ${timePart}`;

            const requestType = data.type; // 'Приёмка', 'Заправка/ремонт', 'Получение'
            const employeeId = data.EmployeeID;
            const comment = data.comment || '';
            const isRequestDefective = !!data.isDefective;

            // Определяем статусы
            let cartridgeTargetStatus = '';
            if (requestType === 'Приёмка') {
                cartridgeTargetStatus = isRequestDefective ? 'Ожидает ремонта' : 'Ожидает заправки';
            } else if (requestType === 'Заправка/ремонт') {
                cartridgeTargetStatus = 'Готов к выдаче';
            } else if (requestType === 'Получение') {
                cartridgeTargetStatus = 'Выдан';
            }

            const existingGuids = data.guids || [];
            const newCartridgesList = data.newCartridges || []; // [{ model: 'HP', amount: 2 }]

            // Массив, в который мы соберем ВСЕ сгенерированные GUID для этой заявки
            let allGeneratedGuids: string[] = [];

            // 1. Создаем саму заявку в БД
            const insertRequestQuery = `
            INSERT INTO public.requests 
                (type, isdefective, status, data, employee, lastchangedata, lastchangeby, comment)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id;
        `;
            const requestResult = await this.databaseService.query(insertRequestQuery, [
                requestType, isRequestDefective, 'Создана', currentDateTime, employeeId, currentDateTime, employeeId, comment
            ]) as any;

            const requestId = requestResult.rows[0].id;

            // 2. Если есть СУЩЕСТВУЮЩИЕ картриджи — обновляем их статус и привязываем к заявке
            if (existingGuids.length > 0) {
                await this.cartridgesService.changeStatusesTo(existingGuids, cartridgeTargetStatus);

                const linkExistingQuery = `
                INSERT INTO public.requestslist (requestid, cartridgeid)
                SELECT $1, c.id
                FROM public.cartridges c
                WHERE c.guid = ANY($2::text[]);
            `;
                await this.databaseService.query(linkExistingQuery, [requestId, existingGuids]);
            }

            // 3. Если есть НОВЫЕ картриджи (из ручного ввода) — создаем их и привязываем к этой же заявке
            for (const newCartridge of newCartridgesList) {
                const amount = Number(newCartridge.amount);
                if (amount <= 0) continue;

                // Генерируем пачку GUID для конкретной модели
                const guidPromises = Array.from({ length: amount }, () => this.databaseService.generateGUID());
                const generatedObjects = await Promise.all(guidPromises);
                const generatedGuids = generatedObjects.map(item => item.guid);

                allGeneratedGuids = [...allGeneratedGuids, ...generatedGuids];

                const insertNewCartridgesQuery = `
                WITH inserted_cartridges AS (
                    INSERT INTO public.cartridges (model, guid, status, isdefective, lastchangedata, lastchangeby)
                    SELECT $1, u.guid, $2, $3, $4, $5
                    FROM unnest($6::text[]) AS u(guid)
                    RETURNING id
                )
                INSERT INTO public.requestslist (requestid, cartridgeid)
                SELECT $7, ic.id
                FROM inserted_cartridges ic;
            `;
                await this.databaseService.query(insertNewCartridgesQuery, [
                    newCartridge.model,
                    cartridgeTargetStatus,
                    isRequestDefective,
                    currentDateTime,
                    employeeId,
                    generatedGuids,
                    requestId
                ]);
            }

            return {
                success: true,
                cartridgesAmount: existingGuids.length + allGeneratedGuids.length,
                GUIDs: allGeneratedGuids // Возвращаем только новые сгенерированные GUID
            };

        } catch (error) {
            console.error("Ошибка в createRequest на бэкенде:", error);
            return { success: false, cartridgesAmount: 0, GUIDs: [] };
        }
    }

}

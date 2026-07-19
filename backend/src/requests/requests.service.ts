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
    // Все заявки, к которым был привязан картридж с данным GUID — для истории картриджа в админке.
    // В отличие от findRequestByGuid, возвращает массив (может быть пустым, без исключений)
    // и сразу отдаёт человекочитаемые имена/даты, как getBaseRequestQuery в AdminService.
    async findRequestsByGuid(guid: string): Promise<any[]> {
        const cartridge = await this.cartridgesService.findByGuid(guid);
        if (!cartridge) return [];

        const result = await this.databaseService.query(`
        SELECT 
            r.id,
            TO_CHAR(r.data, 'DD.MM.YY HH:MI') as data,
            e.fullname as employee_name,
            r.type,
            r.status,
            r.isdefective,
            COALESCE(r.comment, '') as comment,
            le.fullname as lastchangeby_name,
            TO_CHAR(r.lastchangedata, 'DD.MM.YY HH:MI') as lastchangedata
        FROM public.requests r
        JOIN public.requestslist rl ON r.id = rl.requestid
        LEFT JOIN public.employers e ON r.employee = e.id
        LEFT JOIN public.employers le ON r.lastchangeby = le.id
        WHERE rl.cartridgeid = $1
        ORDER BY r.data DESC
    `, [cartridge.id]);

        return result.rows;
    }

    async createRequest(data: any): Promise<{ success: boolean; cartridgesAmount: number; GUIDs: string[] }> {
        try {
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
                    (type, isdefective, status, employee, lastchangeby, comment)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, data;
            `;
            const requestResult = await this.databaseService.query(insertRequestQuery, [
                requestType, isRequestDefective, 'Создана', employeeId, employeeId, comment
            ]) as any;

            const requestId = requestResult.rows[0].id;
            const requestData = requestResult.rows[0].data;

            // 2. Если есть СУЩЕСТВУЮЩИЕ картриджи — обновляем их статус и привязываем к заявке
            if (existingGuids.length > 0) {
                await this.cartridgesService.changeStatusesTo(existingGuids, cartridgeTargetStatus, requestData, employeeId, comment);

                const linkExistingQuery = `
                    INSERT INTO public.requestslist (requestid, cartridgeid)
                    SELECT $1, c.id
                    FROM public.cartridges c
                    WHERE c.guid = ANY($2::text[]);
                `;
                await this.databaseService.query(linkExistingQuery, [requestId, existingGuids]);

                const updateCartridgesQuery = `
                    UPDATE public.cartridges
                    SET comment = $1,
                        lastchangeby = $2,
                        lastchangedata = $4
                    WHERE guid = ANY($3::text[]);
                `;
                await this.databaseService.query(updateCartridgesQuery, [comment, employeeId, existingGuids, requestData]);
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

                // Добавляем поле lastchangedata в список колонок INSERT и передаем $8 параметром
                const insertNewCartridgesQuery = `
                    WITH inserted_cartridges AS (
                        INSERT INTO public.cartridges (model, guid, status, isdefective, lastchangeby, comment, lastchangedata)
                        SELECT $1, u.guid, $2, $3, $4, $5, $8
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
                    employeeId,
                    comment,
                    generatedGuids,
                    requestId,
                    requestData
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

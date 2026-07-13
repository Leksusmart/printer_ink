/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// Структура
export interface Request {
    id: number;
    type: string;
    isDeflective: boolean;
    status: string;
    data: Date;
    employeeID: number;
    lastChangeData: Date;
    lastChangeBy: number;
    comment: string;
}
export interface Cartridge {
    id: number;
    model: string;
    guid: string;
    status: string;
    isDefective: boolean;
    lastChangeData: Date;
    lastChangeBy: number;
}

export interface ImputRequestData {
    type: string;
    isDefective: boolean;
    status: string;
    data: string;
    employeeID: number;
    lastChangeData: string;
    lastChangeBy: number;
    comment: string;
    model: string;
    amount: number;
    guid: string;
    guids: string[];
}

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CartridgesService } from '../cartridges/cartridges.service';

@Injectable()
export class RequestsService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly cartridgesService: CartridgesService,
    ) { }

    async findAll(): Promise<Request[]> {
        const result = await this.databaseService.query(
            `
			SELECT *
			FROM requests
			`,
        );

        // Возвращаем массив строк
        return result.rows;
    }

    async findRequestByGuid(guid: string): Promise<Request | null> {
        // Находим картридж по его GUID
        const cartridge = await this.cartridgesService.findByGuid(guid);

        if (!cartridge) {
            return null;
        }

        // Делаем правильный SQL-запрос с использованием JOIN
        const result = await this.databaseService.query(
            `
			SELECT *
			FROM requests
			WHERE id IN (
			  SELECT requestid
			  FROM requestslist
			  WHERE cartridgeid = $1
			)
			`,
            [cartridge.id],
        );

        // Если в базе ничего не нашлось, возвращаем null
        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    }

    async generateGUID(): Promise<{ guid: string }> {
        let errCounter: number = 0;
        const generationLimit: number = 100000;
        const hexArr: string[] = '0123456789abcdef'.split('');
        const variantArr: string[] = ['8', '9', 'a', 'b'];

        const dbResult = await this.databaseService.query(`SELECT guid FROM cartridges`) as { rows: { guid: string }[] };
        // Превращаем в Set для мгновенного поиска за O(1)
        const existingGUIDs = new Set(
            dbResult.rows.map((row: { guid: string }) => row.guid?.toLowerCase())
        );


        let generatedGUID: string = "";
        let isUnique: boolean = false;

        do {
            const guidChars: string[] = new Array(36);

            for (let i = 0; i < 36; i++) {
                if (i === 8 || i === 13 || i === 18 || i === 23) {
                    guidChars[i] = '-';
                } else if (i === 14) {
                    guidChars[i] = '4'; // Версия 4
                } else if (i === 19) {
                    // Вариант (8, 9, a или b)
                    guidChars[i] = variantArr[Math.floor(Math.random() * variantArr.length)];
                } else {
                    // Любой случайный из hexArr
                    guidChars[i] = hexArr[Math.floor(Math.random() * hexArr.length)];
                }
            }

            // Собираем массив в строку
            generatedGUID = guidChars.join('');

            // Проверяем уникальность
            if (!existingGUIDs.has(generatedGUID)) {
                isUnique = true;
            }

            errCounter++;
        } while (!isUnique && errCounter < generationLimit);

        if (!isUnique) {
            throw new Error('Превышен лимит попыток генерации уникального GUID');
        }

        return { guid: generatedGUID };
    }

    async createRequest(data: ImputRequestData): Promise<{ success: boolean; cartridgesAmount: number; GUIDs: string[] }> {
        try {
            console.log('guid:',data.guid, 'model:',data.model, 'amount:',data.amount);
            if (data.guid !== "") {
                // Если картридж уже существует
                // Меняем его статус на пустой или сломанный
                const status = data.isDefective ? "Ожидает ремонта" : "Ожидает заправки";
                const result = await this.cartridgesService.changeStatusesTo([data.guid], status);

                if (result.success === true) {
                    // Создаем саму заявку и связываем с картриджем в БД
                    const queryText = `
                        WITH inserted_request AS (
                            INSERT INTO requests (type, isDefective, status, data, employee, lastChangeData, lastChangeBy, comment)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                            RETURNING id
                        )
                        INSERT INTO requestslist (requestid, cartridgeid)
                        SELECT ir.id, c.id
                        FROM inserted_request ir
                        CROSS JOIN cartridges c
                        WHERE c.guid = $9; -- Привязываем к нашему существующему картриджу
                    `;

                    const queryParams = [
                        data.type,            // $1
                        data.isDefective,     // $2
                        data.status,          // $3
                        data.data,            // $4
                        data.employeeID,      // $5
                        data.lastChangeData,  // $6
                        data.lastChangeBy,    // $7
                        data.comment,         // $8
                        data.guid             // $9
                    ];

                    await this.databaseService.query(queryText, queryParams);

                    return {
                        success: true,
                        cartridgesAmount: 0,
                        GUIDs: []
                    };
                } else {
                    return { success: false, cartridgesAmount: 0, GUIDs: [] };
                }
            } else if (data.model !== "" && data.amount !== 0) {
                // Если картриджи новые для системы
                // 1. Создаем массив промисов
                const guidPromises = Array.from({ length: data.amount }, () => this.generateGUID());

                // 2. Дожидаемся выполнения всех промисов
                const generatedObjects = await Promise.all(guidPromises);

                // 3. Вытаскиваем чистые строки UUID из объектов
                const guids = generatedObjects.map(item => item.guid);

                const queryText = `
					WITH inserted_request AS (
						-- 1. Создаем заявку и получаем ее ID
						INSERT INTO requests (type, isDefective, status, data, employee, lastChangeData, lastChangeBy, comment)
						VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
						RETURNING id
					),
					inserted_cartridges AS (
						-- 2. Разворачиваем массив GUID и пачкой вставляем картриджи
						INSERT INTO cartridges (model, guid, status, isDefective, lastChangeData, lastChangeBy)
						SELECT $9, unnest($10::text[]), $11, $2, $6, $7
						RETURNING id, guid
					),
					inserted_list AS (
						-- 3. Связываем созданную заявку со всеми созданными картриджами
						INSERT INTO requestslist (requestid, cartridgeid)
						SELECT inserted_request.id, inserted_cartridges.id
						FROM inserted_request, inserted_cartridges
						RETURNING cartridgeid
					)
					-- 4. ВОЗВРАЩАЕМ реальные GUID из базы данных
					SELECT ic.guid 
					FROM inserted_list il
					JOIN inserted_cartridges ic ON il.cartridgeid = ic.id;
					`;

                const queryParams = [
                    data.type,            // $1
                    data.isDefective,    // $2
                    data.status,          // $3
                    data.data,            // $4
                    data.employeeID,        // $5
                    data.lastChangeData,  // $6
                    data.lastChangeBy,    // $7
                    data.comment,         // $8
                    data.model,           // $9
                    guids,                 // $10
                    data.isDefective ? 'Ожидает ремонта' : 'Ожидает заправки'// $11
                ];

                const result = await this.databaseService.query(queryText, queryParams) as {
                    rows: { guid: string }[]
                };

                // Проверяем, что база вернула строки
                if (!result.rows || result.rows.length === 0) {
                    return {
                        success: false,
                        cartridgesAmount: 0,
                        GUIDs: []
                    };
                }

                // Вытаскиваем из строк базы чистый массив строк
                const savedGuids = result.rows.map(row => row.guid);

                return {
                    success: true,
                    cartridgesAmount: savedGuids.length,
                    GUIDs: savedGuids
                };
            } else if (data.guids.length > 0) {
                // Если приёмка
                // Выполняем оптимизированный массовый запрос
                const result = await this.cartridgesService.changeStatusesTo(data.guids, "Выдан");

                if (!result.success) {
                    return {
                        success: false,
                        cartridgesAmount: 0,
                        GUIDs: []
                    };
                }
                return {
                    success: true,
                    cartridgesAmount: 0,
                    GUIDs: []
                };

            } else {
                return {
                    success: false,
                    cartridgesAmount: 0,
                    GUIDs: []
                };
            }
        } catch (error) {
            console.error("Ошибка при создании заявки и картриджей:", error);

            return {
                success: false,
                cartridgesAmount: 0,
                GUIDs: []
            };
        }
    }

}
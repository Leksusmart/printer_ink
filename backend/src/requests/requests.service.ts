/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */

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

  async generateGUID(): Promise<{ guid: string }> {
    
    let errCounter = 0;
    const generationLimit = 100000;
    const hexArr = '0123456789abcdef'.split('');
    const variantArr = ['8', '9', 'a', 'b'];

    const dbResult = await this.databaseService.query(`SELECT guid FROM public.cartridges`) as { rows: { guid: string }[] };
    const existingGUIDs = new Set(dbResult.rows.map(row => row.guid?.toLowerCase()));

    let generatedGUID = "";
    let isUnique = false;

    do {
      const guidChars = new Array(36);
      for (let i = 0; i < 36; i++) {
        if ([8,13,18,23].includes(i)) guidChars[i] = '-';
        else if (i === 14) guidChars[i] = '4';
        else if (i === 19) guidChars[i] = variantArr[Math.floor(Math.random() * variantArr.length)];
        else guidChars[i] = hexArr[Math.floor(Math.random() * hexArr.length)];
      }
      generatedGUID = guidChars.join('');
      if (!existingGUIDs.has(generatedGUID)) isUnique = true;
      errCounter++;
    } while (!isUnique && errCounter < generationLimit);

    if (!isUnique) throw new Error('Превышен лимит генерации GUID');
    return { guid: generatedGUID };
  }

    async createRequest(data: any): Promise<{ success: boolean; cartridgesAmount: number; GUIDs: string[] }> {
        try {
            const currentDateTime = new Date().toISOString();

            if (data.guid && data.guid.length > 0) {
                // Существующий картридж (data.guid приходит массивом, даже если в нём один элемент)
                const status = data.isDefective ? "Ожидает ремонта" : "Ожидает заправки";
                const result = await this.cartridgesService.changeStatusesTo(data.guid, status);

                if (result.success) {
                    const queryText = `
          WITH inserted_request AS (
            INSERT INTO public.requests 
              (type, isdefective, status, data, employee, lastchangedata, lastchangeby, comment)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
          )
          INSERT INTO public.requestslist (requestid, cartridgeid)
          SELECT ir.id, c.id
          FROM inserted_request ir
          CROSS JOIN public.cartridges c
          WHERE c.guid = ANY($9::text[]);
        `;

                    await this.databaseService.query(queryText, [
                        data.type,
                        data.isDefective,
                        data.status,
                        currentDateTime,
                        data.employeeID,
                        currentDateTime,
                        data.employeeID,
                        data.comment || '',
                        data.guid
                    ]);

                    return { success: true, cartridgesAmount: 1, GUIDs: [] };
                }
            }
            else if (data.model && data.amount > 0) {
                // Новые картриджи
                const guidPromises = Array.from({ length: data.amount }, () => this.generateGUID());
                const generatedObjects = await Promise.all(guidPromises);
                const guids = generatedObjects.map(item => item.guid);

                const queryText = `
        WITH inserted_request AS (
          INSERT INTO public.requests 
            (type, isdefective, status, data, employee, lastchangedata, lastchangeby, comment)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        ),
        inserted_cartridges AS (
          INSERT INTO public.cartridges (model, guid, status, isdefective, lastchangedata, lastchangeby)
          SELECT $9, unnest($10::text[]), $11, $2, $6, $7
          RETURNING id, guid
        ),
        inserted_list AS (
          INSERT INTO public.requestslist (requestid, cartridgeid)
          SELECT inserted_request.id, inserted_cartridges.id
          FROM inserted_request, inserted_cartridges
        )
        SELECT guid FROM inserted_cartridges;
      `;

                const result = await this.databaseService.query(queryText, [
                    data.type,
                    data.isDefective,
                    data.status,
                    currentDateTime,
                    data.employeeID,
                    currentDateTime,
                    data.employeeID,
                    data.comment || '',
                    data.model,
                    guids,
                    data.isDefective ? 'Ожидает ремонта' : 'Ожидает заправки'
                ]) as any;

                const savedGuids = result.rows ? result.rows.map((r: any) => r.guid) : guids;

                return {
                    success: true,
                    cartridgesAmount: savedGuids.length,
                    GUIDs: savedGuids
                };
            }
            else if (data.guids && data.guids.length > 0) {
                // Целевой статус картриджа после заявки зависит от её типа:
                // Получение — картридж выдан сотруднику, Заправка/ремонт — картридж снова готов к выдаче
                const cartridgeTargetStatus = data.type === 'Заправка/ремонт' ? 'Готов к выдаче' : 'Выдан';
                const result = await this.cartridgesService.changeStatusesTo(data.guids, cartridgeTargetStatus);
                if (result.success) {
                    // Создаём заявку и сразу привязываем к ней все переданные картриджи через requestslist
                    const queryText = `
          WITH inserted_request AS (
            INSERT INTO public.requests 
              (type, isdefective, status, data, employee, lastchangedata, lastchangeby, comment)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
          )
          INSERT INTO public.requestslist (requestid, cartridgeid)
          SELECT ir.id, c.id
          FROM inserted_request ir
          CROSS JOIN public.cartridges c
          WHERE c.guid = ANY($9::text[]);
        `;

                    await this.databaseService.query(queryText, [
                        data.type,
                        false,
                        data.status,
                        currentDateTime,
                        data.employeeID,
                        currentDateTime,
                        data.employeeID,
                        data.comment || '',
                        data.guids
                    ]);

                    return { success: true, cartridgesAmount: data.guids.length, GUIDs: [] };
                }
            }

            return { success: false, cartridgesAmount: 0, GUIDs: [] };
        } catch (error) {
            console.error("Ошибка createRequest:", error);
            return { success: false, cartridgesAmount: 0, GUIDs: [] };
        }
    }
}

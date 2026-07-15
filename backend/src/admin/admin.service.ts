/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */

import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RequestsService } from '../requests/requests.service';
import { CartridgesService } from '../cartridges/cartridges.service';
import * as bcrypt from 'bcrypt';
import { normalizePhone } from '../utils/phone.helper';

@Injectable()
export class AdminService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly cartridgesService: CartridgesService,
        @Inject(forwardRef(() => RequestsService))
        private readonly requestsService: RequestsService
    ) { }

    async scrapCartridgeByGuid(guid: string) {
        return await this.cartridgesService.changeStatusesTo([guid], 'Списан');
    }

    async getStats() {
        try {
            const query = `
	  WITH stats AS (
		SELECT 
		  COUNT(CASE WHEN status = 'Заправлен' OR status = 'Готов к выдаче' THEN 1 END) as filled,
		  COUNT(CASE WHEN status = 'Ожидает заправки' THEN 1 END) as empty,
		  COUNT(CASE WHEN status = 'Ожидает ремонта' THEN 1 END) as repair,
		  COUNT(CASE WHEN isdefective = true THEN 1 END) as defective,
		  COUNT(CASE WHEN status = 'Выдан' OR status = 'Готов к выдаче' THEN 1 END) as readyToIssue,
		  COUNT(*) as totalCartridges,
		  COUNT(CASE WHEN status NOT IN ('Выдан', 'Списан') THEN 1 END) as idle
		FROM public.cartridges
	  ),
	  history AS (
		SELECT 
		  COUNT(CASE WHEN type = 'Приёмка' AND status = 'Выполнена' THEN 1 END) as totalFilled,
		  COUNT(CASE WHEN type = 'Получение' THEN 1 END) as totalIssued,
		  COUNT(CASE WHEN isdefective = true THEN 1 END) as totalScrapped
		FROM public.requests
	  )
	  SELECT 
		json_build_object(
		  'counters', (SELECT row_to_json(s) FROM stats s),
		  'historyStats', (SELECT row_to_json(h) FROM history h)
		) as stats;
	`;

            const result = await this.databaseService.query(query);
            return result.rows[0]?.stats || { counters: {}, historyStats: {} };
        } catch (error) {
            console.error('getStats error:', error);
            return {
                counters: { filled: 0, empty: 0, repair: 0, readyToIssue: 0, totalCartridges: 0, idle: 0 },
                historyStats: { totalFilled: 0, totalIssued: 0, totalScrapped: 0 }
            };
        }
    }

    private getBaseRequestQuery(whereClause: string = ''): string {
        return `
	  SELECT 
		r.id, TO_CHAR(r.data, 'DD.MM.YY HH:MI') as data,
		e.fullname as employee_name, r.type, r.status,
		COUNT(rl.cartridgeid)::int as cartridges_count,
		r.isdefective, COALESCE(r.comment, '') as comment,
		COALESCE(le.fullname, 'Не менялся') as lastchangeby_name,
		TO_CHAR(r.lastchangedata, 'DD.MM.YY HH:MI') as lastchangedata
	  FROM public.requests r
	  LEFT JOIN public.employers e ON r.employee = e.id
	  LEFT JOIN public.requestslist rl ON r.id = rl.requestid
	  LEFT JOIN public.employers le ON r.lastchangeby = le.id
	  ${whereClause}
	  GROUP BY r.id, e.fullname, le.fullname
	  ORDER BY r.data DESC
	`;
    }

    async getHistoryLogs() {
        const query = this.getBaseRequestQuery();
        const result = await this.databaseService.query(query);
        return result.rows;
    }

    async getRefillRequests() {
        const filter = `JOIN public.cartridges c ON rl.cartridgeid = c.id WHERE c.status = 'Ожидает заправки'`;
        const query = this.getBaseRequestQuery(filter);
        const result = await this.databaseService.query(query);
        return result.rows;
    }

    async getRepairRequests() {
        const filter = `JOIN public.cartridges c ON rl.cartridgeid = c.id WHERE c.status = 'Ожидает ремонта'`;
        const query = this.getBaseRequestQuery(filter);
        const result = await this.databaseService.query(query);
        return result.rows;
    }

    async createCartridge(model: string, guid: string, status: string = 'Ожидает заправки', isdefective = false, adminId: number | null) {
        if (!model?.trim() || !guid?.trim()) {
            throw new BadRequestException('Модель и GUID обязательны');
        }

        const result = await this.databaseService.query(`
	  INSERT INTO public.cartridges (model, guid, status, isdefective, lastchangeby)
	  VALUES ($1, $2, $3, $4, $5) RETURNING *
	`, [model.trim(), guid.trim(), status, isdefective, adminId]);

        return result.rows[0];
    }

    async createEmployer(fullname: string, phone: string, role: string = 'User', password?: string) {
        if (!phone || !fullname) throw new BadRequestException('Телефон и ФИО обязательны');

        const checkedPhone = normalizePhone(phone);

        const exists = await this.databaseService.query('SELECT id FROM public.employers WHERE phone = $1', [checkedPhone]);
        if (exists.rows.length > 0) throw new BadRequestException('Пользователь уже существует');

        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

        const result = await this.databaseService.query(`
	  INSERT INTO public.employers (phone, fullname, role, password)
	  VALUES ($1, $2, $3, $4) RETURNING id, phone, fullname, role
	`, [checkedPhone, fullname.trim(), role, hashedPassword]);

        return result.rows[0];
    }

    async getNewGUID(): Promise<string> {
        const result = await this.requestsService.generateGUID();
        return result.guid;
    }

    async getSettings() {
        const result = await this.databaseService.query(`SELECT * FROM public.dashboard_settings WHERE id = 1`);
        if (result.rows.length === 0) {
            return {
                refill_threshold: 10
            };
        }
        return result.rows[0];
    }

    async updateSettings(settings: any) {
        await this.databaseService.query(`
	  UPDATE public.dashboard_settings 
	  SET filled_red_from = $1, filled_red_to = $2,
		  filled_yellow_from = $3, filled_yellow_to = $4,
		  filled_green_from = $5, filled_green_to = $6,
		  empty_red_from = $7, empty_red_to = $8,
		  empty_yellow_from = $9, empty_yellow_to = $10,
		  empty_green_from = $11, empty_green_to = $12,
		  refill_threshold = $13
	  WHERE id = 1`, [
            settings.filled_red_from, settings.filled_red_to,
            settings.filled_yellow_from, settings.filled_yellow_to,
            settings.filled_green_from, settings.filled_green_to,
            settings.empty_red_from, settings.empty_red_to,
            settings.empty_yellow_from, settings.empty_yellow_to,
            settings.empty_green_from, settings.empty_green_to,
            settings.refill_threshold
        ]);
        await this.checkAndAutoCreateRefillRequest();
        return { success: true };
    }

    async checkAndAutoCreateRefillRequest() {
        const settingsQuery = await this.databaseService.query(`SELECT refill_threshold FROM public.dashboard_settings WHERE id = 1`);
        const threshold = settingsQuery.rows[0]?.refill_threshold ?? 10;

        const emptyCountQuery = await this.databaseService.query(`SELECT COUNT(*)::int as count FROM public.cartridges WHERE status = 'Ожидает заправки'`);
        const currentEmptyCount = emptyCountQuery.rows[0]?.count ?? 0;

        if (currentEmptyCount >= threshold && currentEmptyCount > 0) {
            console.log(`[Автоматизация] Запасы (${currentEmptyCount}) >= порог (${threshold})`);

            const emptyCartridgesQuery = await this.databaseService.query(`SELECT id FROM public.cartridges WHERE status = 'Пустой'`);
            const cartridgeIds = emptyCartridgesQuery.rows.map(row => row.id);

            const result = await this.databaseService.query(`
		INSERT INTO public.requests (type, isdefective, status, employee, lastchangeby, comment) 
		VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
	  `, ['Ожидает заправки', false, 'Создана', null, null, 'Автоматическая заявка']);

            const newRequestId = result.rows[0].id;

            for (const cartridgeId of cartridgeIds) {
                await this.databaseService.query(`INSERT INTO public.requestslist (requestid, cartridgeid) VALUES ($1, $2)`, [newRequestId, cartridgeId]);
            }

            console.log(`[Автоматизация] Заявка #${newRequestId} создана`);
        }
    }
}

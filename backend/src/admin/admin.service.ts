import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CartridgesService } from '../cartridges/cartridges.service';
import * as bcrypt from 'bcrypt';
import { normalizePhone } from '../utils/phone.helper';

@Injectable()
export class AdminService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly cartridgesService: CartridgesService
    ) { }

    async scrapCartridgeByGuid(guid: string) {
        return await this.cartridgesService.changeStatusesTo([guid], 'Списан');
    }

    async getStats() {
        try {
            const query = `
      WITH stats AS (
        SELECT 
          COUNT(CASE WHEN status = 'Готов к выдаче' THEN 1 END) as readytoissue,
          COUNT(CASE WHEN status = 'Ожидает заправки' THEN 1 END) as empty,
          COUNT(CASE WHEN status = 'Ожидает ремонта' THEN 1 END) as repair,
          COUNT(CASE WHEN isdefective = true THEN 1 END) as defective,
          COUNT(*) as totalcartridges,
          COUNT(CASE WHEN status NOT IN ('Выдан', 'Списан') THEN 1 END) as idle
        FROM public.cartridges
      ),
      history AS (
        SELECT 
          COUNT(CASE WHEN type = 'Заправка/ремонт' THEN 1 END) as totalfilled,
          COUNT(CASE WHEN type = 'Получение' THEN 1 END) as totalissued,
          COUNT(CASE WHEN status = 'Списан' AND type = 'Списание' THEN 1 END) as totalscrapped
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
                counters: {
                    readytoissue: 0,
                    empty: 0,
                    repair: 0,
                    defective: 0,
                    totalcartridges: 0,
                    idle: 0
                },
                historyStats: {
                    totalfilled: 0,
                    totalissued: 0,
                    totalscrapped: 0
                }
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
		le.fullname as lastchangeby_name,
		TO_CHAR(r.lastchangedata, 'DD.MM.YY HH:MI') as lastchangedata
	  FROM public.requests r
	  LEFT JOIN public.employers e ON r.employee = e.id
	  LEFT JOIN public.requestslist rl ON r.id = rl.requestid
	  LEFT JOIN public.employers le ON r.lastchangeby = le.id
	  ${whereClause}
	  GROUP BY 
        r.id, 
        r.data, 
        e.fullname, 
        r.type, 
        r.status, 
        r.isdefective, 
        r.comment, 
        le.fullname, 
        r.lastchangedata
      ORDER BY r.data DESC
	`;
    }

    // История абсолютно всех заявок
    async getHistoryLogs() {
        const query = this.getBaseRequestQuery();
        const result = await this.databaseService.query(query);
        return result.rows;
    }

    // Объединённые заявки на заправку и ремонт (одна вкладка на фронте)
    async getRefillRepairRequests() {
        const filter = `
            WHERE r.type = 'Заправка/ремонт'
        `;
        const query = this.getBaseRequestQuery(filter);
        const result = await this.databaseService.query(query);
        return result.rows;
    }

    // Заявки на приёмку
    async getReceivingRequests() {
        const filter = `
            WHERE r.type = 'Приёмка'
        `;
        const query = this.getBaseRequestQuery(filter);
        const result = await this.databaseService.query(query);
        return result.rows;
    }

    // Заявки на списание
    async getScrapRequests() {
        const filter = `
            WHERE r.type = 'Списание'
        `;
        const query = this.getBaseRequestQuery(filter);
        const result = await this.databaseService.query(query);
        return result.rows;
    }

    // Заявки на получение
    async getIssuanceRequests() {
        const filter = `
            WHERE r.type = 'Получение'
        `;
        const query = this.getBaseRequestQuery(filter);
        const result = await this.databaseService.query(query);
        return result.rows;
    }

    // Список картриджей (модель + GUID) для конкретной заявки — для кнопки "Подробнее"
    async getCartridgesForRequest(requestId: number) {
        const query = `
            SELECT c.model, c.guid
            FROM public.requestslist rl
            JOIN public.cartridges c ON rl.cartridgeid = c.id
            WHERE rl.requestid = $1
        `;
        const result = await this.databaseService.query(query, [requestId]);
        return result.rows;
    }

    async createCartridge(model: string, guid: string, status: string = 'Ожидает заправки', isdefective = false, adminId: number | null) {
        if (!model?.trim() || !guid?.trim()) {
            throw new BadRequestException('Модель и GUID обязательны');
        }

        const result = await this.databaseService.query(`
            INSERT INTO public.cartridges (model, guid, status, isdefective, lastchangeby)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [
            model.trim(),
            guid.trim(),
            status,
            isdefective,
            adminId
        ]);

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
			VALUES ($1, $2, $3, $4)
			RETURNING id, phone, fullname, role
		`, [checkedPhone, fullname.trim(), role, hashedPassword]);

        return result.rows[0];
    }

    async getNewGUID(): Promise<string> {
        const result = await this.databaseService.generateGUID();
        return result.guid;
    }

    async getSettings() {
        const result = await this.databaseService.query(`SELECT * FROM public.dashboard_settings WHERE id = 1`);
        if (result.rows.length === 0) {
            return { refillthreshold: 10, rowsCollapsedLimit: 3 };  // ← default
        }
        return result.rows[0];
    }

    async updateSettings(settings: any) {
        const result = await this.databaseService.query(`
      UPDATE public.dashboard_settings 
      SET 
          refillthreshold = $1,
          rowsCollapsedLimit = $2
      WHERE id = 1
      RETURNING *`,
            [settings.refillthreshold, settings.rowsCollapsedLimit]
        );
        if (result.rows[0].refillTreshold != settings.refillthreshold || result.rows[0].rowsCollapsedLimit != settings.rowsCollapsedLimit)
        {
            return { success: false };
        }
        return { success: true };
    }
}

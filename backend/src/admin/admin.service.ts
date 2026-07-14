/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RequestsService } from '../requests/requests.service';
import { CartridgesService } from '../cartridges/cartridges.service';
import * as bcrypt from 'bcrypt';


@Injectable()
export class AdminService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly cartridgesService: CartridgesService,
        @Inject(forwardRef(() => RequestsService)) // Обязательный декоратор для циклов
        private readonly requestsService: RequestsService
    ) { }

    // Метод-обертка для вызова вашей готовой логики списания
    async scrapCartridgeByGuid(guid: string) {
        // Ваша функция ожидает массив строк [guids] и строку нового статуса
        return await this.cartridgesService.changeStatusesTo([guid], 'Списан');
    }

    // Сбор счетчиков картриджей и статистики по заявкам
    async getDashboardStats() {
        // 1. Счетчики верхних блоков (Текущее состояние базы на данный момент)
        const filledQuery = await this.databaseService.query(`SELECT COUNT(*)::int as count FROM public.cartridges WHERE status = 'Готов к выдаче'`);
        const emptyQuery = await this.databaseService.query(`SELECT COUNT(*)::int as count FROM public.cartridges WHERE status = 'Ожидает заправки'`);
        const defectiveQuery = await this.databaseService.query(`SELECT COUNT(*)::int as count FROM public.cartridges WHERE isdefective = true`);

        // 2. Считать картриджи, прикреплённые к завершенным заявкам типа 'ПРИЕМКА'
        const filledCartridges = await this.databaseService.query(`
            SELECT COUNT(rl.cartridgeid)::int as count
            FROM public.requests r
            JOIN public.requestslist rl ON r.id = rl.requestid
            WHERE r.type = 'Приёмка' AND r.status = 'Завершена'
        `);

        // 3. Считать картриджи, прикреплённые к завершенным заявкам типа 'ПОЛУЧЕНИЕ'
        const issuedCartridges = await this.databaseService.query(`
            SELECT COUNT(rl.cartridgeid)::int as count
            FROM public.requests r
            JOIN public.requestslist rl ON r.id = rl.requestid
            WHERE r.type = 'Получение' AND r.status = 'Завершена'
        `);

        // 4. Считать картриджи, если их текущий статус равен 'Ожидает ремонта'
        const defectsCartridges = await this.databaseService.query(`
            SELECT COUNT(*)::int as count 
            FROM public.cartridges 
            WHERE status = 'Ожидает ремонта'
        `);

        // 5. Считать картриджи, если их текущий статус равен 'Списан'
        const scrappedCartridges = await this.databaseService.query(`
            SELECT COUNT(*)::int as count 
            FROM public.cartridges 
            WHERE status = 'Списан'
        `);

        // 6. Считать количество заявок (не картриджей), если их статус не равен 'Завершена'
        const activeRequests = await this.databaseService.query(`
            SELECT COUNT(*)::int as count 
            FROM public.requests 
            WHERE status != 'Завершена'
        `);

        // 7. Формируем итоговый объект, полностью совпадающий с интерфейсом DashboardStats
        return {
            counters: {
                filled: filledQuery.rows[0]?.count || 0,
                empty: emptyQuery.rows[0]?.count || 0,
                defective: defectiveQuery.rows[0]?.count || 0,
            },
            historyStats: {
                totalFilled: filledCartridges.rows[0]?.count || 0,
                totalIssued: issuedCartridges.rows[0]?.count || 0,
                totalDefects: defectsCartridges.rows[0]?.count || 0,
                totalScrapped: scrappedCartridges.rows[0]?.count || 0,
                activeOrders: activeRequests.rows[0]?.count || 0,
            }
        };
    }

    // Метод-хелпер для генерации базового SQL-запроса к заявкам
    private getBaseRequestQuery(whereClause: string = ''): string {
        return `
            SELECT 
                r.id,
                TO_CHAR(r.data, 'DD.MM.YY HH:MI') as data,
                e.fullname as employee_name,
                r.type,
                r.status,
                COUNT(rl.cartridgeid)::int as cartridges_count,
                r.isdefective,
                COALESCE(r.comment, '') as comment,
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

    // История абсолютно всех заявок
    async getHistoryLogs() {
        const query = this.getBaseRequestQuery();
        const result = await this.databaseService.query(query);
        return result.rows;
    }

    // Заявки на заправку (все, где статус "Ожидает заправки")
    async getRefillRequests() {
        // Делаем дополнительный JOIN с таблицей cartridges, чтобы проверить статус самого картриджа
        const filter = `
            JOIN public.cartridges c ON rl.cartridgeid = c.id
            WHERE c.status = 'Ожидает заправки'
        `;
        const query = this.getBaseRequestQuery(filter);
        const result = await this.databaseService.query(query);
        return result.rows;
    }

    // Заявки на ремонт (все, где статус "Ожидает ремонта")
    async getRepairRequests() {
        // Делаем дополнительный JOIN с таблицей cartridges, чтобы проверить статус самого картриджа
        const filter = `
            JOIN public.cartridges c ON rl.cartridgeid = c.id
            WHERE c.status = 'Ожидает ремонта'
        `;
        const query = this.getBaseRequestQuery(filter);
        const result = await this.databaseService.query(query);
        return result.rows;
    }

    // Создание нового картриджа создаёт полную сущность картриджа
    async createCartridgeInDb(model: string, guid: string, status: string, isdefective: boolean, adminId: number | null) {
        if (!model || !model.trim()) {
            throw new BadRequestException('Модель картриджа обязательна');
        }
        if (!guid || !guid.trim()) {
            throw new BadRequestException('GUID картриджа обязателен');
        }

        const result = await this.databaseService.query(`
            INSERT INTO public.cartridges (model, guid, status, isdefective, lastchangeby)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [
            model.trim(),
            guid.trim(),
            status || 'Ожидает заправки',
            isdefective || false,
            adminId
        ]);

        return result.rows[0];
    }

    // Создание нового пользователя
    async createEmployer(fullname: string, phone: string, role: string, password?: string) {
        console.log('role', role, 'password', password);
        if (!phone || !fullname) throw new BadRequestException('Телефон и ФИО обязательны');

        let checkedPhone = phone.trim();
        if (checkedPhone.length === 11 && checkedPhone.startsWith('7')) checkedPhone = '+' + checkedPhone;
        else if (checkedPhone.length === 11 && checkedPhone.startsWith('8')) checkedPhone = '+7' + checkedPhone.slice(1);

        // Проверяем, нет ли уже такого пользователя
        const exists = await this.databaseService.query('SELECT id FROM public.employers WHERE phone = $1', [checkedPhone]);
        if (exists.rows.length > 0) throw new BadRequestException('Пользователь с таким телефоном уже существует');

        // Если передан пароль — хэшируем его, если нет — пишем NULL
        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

        const result = await this.databaseService.query(`
			INSERT INTO public.employers (phone, fullname, role, password)
			VALUES ($1, $2, $3, $4)
			RETURNING id, phone, fullname, role
		`, [checkedPhone, fullname.trim(), role || 'User', hashedPassword]);

        return result.rows[0];
    }

    // Обёртка для вызова вашей существующей функции генерации
    async getNewGUID(): Promise<string> {
        // Вызываем вашу функцию
        const result = await this.requestsService.generateGUID();

        // Достаем свойство guid из объекта, который вернула ваша функция
        return result.guid;
    }

    async getSettings() {
        const result = await this.databaseService.query(
            `SELECT 
                filled_red_from, filled_red_to,
                filled_yellow_from, filled_yellow_to,
                filled_green_from, filled_green_to,
                empty_red_from, empty_red_to,
                empty_yellow_from, empty_yellow_to,
                empty_green_from, empty_green_to,
                refill_threshold
             FROM public.dashboard_settings 
             WHERE id = 1`
        );

        // Если в базе почему-то нет строки, возвращаем дефолтные значения
        if (result.rows.length === 0) {
            return {
                filled_red_from: 0, filled_red_to: 5,
                filled_yellow_from: 6, filled_yellow_to: 9,
                filled_green_from: 10, filled_green_to: 999,
                empty_red_from: 10, empty_red_to: 999,
                empty_yellow_from: 6, empty_yellow_to: 9,
                empty_green_from: 0, empty_green_to: 5,
                refill_threshold: 10
            };
        }

        return result.rows[0];
    }

    // Обновление настроек в БД (всегда перезаписываем id = 1)
    async updateSettings(settings: any) {
        await this.databaseService.query(
            `UPDATE public.dashboard_settings 
             SET 
                filled_red_from = $1, filled_red_to = $2,
                filled_yellow_from = $3, filled_yellow_to = $4,
                filled_green_from = $5, filled_green_to = $6,
                empty_red_from = $7, empty_red_to = $8,
                empty_yellow_from = $9, empty_yellow_to = $10,
                empty_green_from = $11, empty_green_to = $12,
                refill_threshold = $13
             WHERE id = 1`,
            [
                settings.filled_red_from, settings.filled_red_to,
                settings.filled_yellow_from, settings.filled_yellow_to,
                settings.filled_green_from, settings.filled_green_to,
                settings.empty_red_from, settings.empty_red_to,
                settings.empty_yellow_from, settings.empty_yellow_to,
                settings.empty_green_from, settings.empty_green_to,
                settings.refill_threshold
            ]
        );
        await this.checkAndAutoCreateRefillRequest();
        return { success: true };
    }

    /**
     * Проверяет текущие остатки пустых картриджей и при пересечении порога
     * автоматически формирует системную заявку "Ожидает заправки"
     */
    async checkAndAutoCreateRefillRequest() {
        // Получаем текущее значение порога из настроек
        const settingsQuery = await this.databaseService.query(
            `SELECT refill_threshold FROM public.dashboard_settings WHERE id = 1`
        );
        const threshold = settingsQuery.rows[0]?.refill_threshold ?? 10;

        // Считаем, сколько сейчас картриджей имеют статус 'Ожидает заправки'
        const emptyCountQuery = await this.databaseService.query(
            `SELECT COUNT(*)::int as count FROM public.cartridges WHERE status = 'Ожидает заправки'`
        );
        const currentEmptyCount = emptyCountQuery.rows[0]?.count ?? 0;

        // если пустых картриджей Больше или Равно порогу, запускаем автоматизацию
        if (currentEmptyCount >= threshold && currentEmptyCount > 0) {


            console.log(`[Автоматизация] Запасы пустых картриджей (${currentEmptyCount}) достигли порога (${threshold}). Формируем заявку.`);

            // 4. Получаем список ID всех картриджей со статусом 'Пустой' на текущий момент
            const emptyCartridgesQuery = await this.databaseService.query(
                `SELECT id FROM public.cartridges WHERE status = 'Пустой'`
            );
            const cartridgeIds = emptyCartridgesQuery.rows.map(row => row.id);


            // Создаем саму заявку. Поля employee и lastchangeby передаем как NULL
            const result = await this.databaseService.query(
                `INSERT INTO public.requests 
                    (type, isdefective, status, employee, lastchangeby, comment) 
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id`, // RETURNING пишется обычно заглавными, но регистр не важен
                [
                    'Ожидает заправки',
                    false,
                    'Создана',
                    null, // employee == null
                    null, // lastchangeby == null
                    'Автоматическая заявка по достижению порогового значения запасов'
                ]
            );
            const newRequestId = result.rows[0].id;
            // Привязываем абсолютно все текущие пустые картриджи к этой новой заявке
            for (const cartridgeId of cartridgeIds) {

                await this.databaseService.query(
                    `INSERT INTO public.requestslist (requestid, cartridgeid) VALUES ($1, $2)`,
                    [newRequestId, cartridgeId]
                );

                // Опционально: если нужно сразу перевести статус этих картриджей в 'Ожидает заправки',
                // чтобы они ушли из списка "Пустые", раскомментируйте строчку ниже:
                // await this.databaseService.query(`UPDATE public.cartridges SET status = 'Ожидает заправки' WHERE id = $1`, [cartridgeId]);
            }

            console.log(`[Автоматизация] Заявка #${newRequestId} успешно создана. Привязано картриджей: ${cartridgeIds.length} шт.`);

        }
    }

}

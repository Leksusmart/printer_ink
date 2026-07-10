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
	employee: number;
	lastchangedata: Date;
	lastchangeby: number;
	comment: string;
}
export interface Cartridge {
	id: number;
	model: string;
	guid: string;
	status: string;
	isdefective: boolean;
	lastchangedata: Date;
	lastchangeby: number;
}

export interface CreateRequestDto {
	type: string;
	isDeflective: boolean;
	status: string;
	data: string;
	employee: number;
	lastchangedata: string;
	lastchangeby: number;
	comment: string;
	cartridgesList: { model: string; count: number }[];
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
			ORDER BY data
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


	// Функция создания заявки
	async create(data: CreateRequestDto): Promise<{ success: boolean; requestId: number }> {

		// 1. Узнаем максимальный текущий ID в таблице requests, чтобы сделать счетчик вручную
		const maxIdResult = await this.databaseService.query(
			`SELECT COALESCE(MAX(id), 0) as max_id FROM requests;`
		) as { rows: { max_id: string | number }[] };

		// Прибавляем к максимальному ID единицу — получаем новый неповторимый номер
		const nextId = Number(maxIdResult.rows[0].max_id) + 1;

		// 2. Добавляем "id" и параметр $1 в сам SQL-запрос вставки
		const requestResult = await this.databaseService.query(
			`
			INSERT INTO requests (id, type, "isDeflective", status, data, employee, lastchangedata, lastchangeby, comment)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			RETURNING id;
			`,
			[
				nextId, // Подставляем наш сгенерированный ID
				data.type,
				data.isDeflective,
				data.status,
				data.data,
				data.employee,
				data.lastchangedata,
				data.lastchangeby,
				data.comment,
			],
		) as { rows: { id: number }[] };

		const newRequestId = requestResult.rows[0].id;
		// Проверяем список картриджей
		if (data.cartridgesList && Array.isArray(data.cartridgesList)) {

			// 1. Перед циклом один раз узнаем максимальный ID в таблице requestslist
			const maxListIdResult = await this.databaseService.query(
				`SELECT COALESCE(MAX(id), 0) as max_id FROM requestslist;`
			) as { rows: { max_id: string | number }[] };

			// Наш счетчик для requestslist начнется с этого номера
			// 1. Указываем, что в массиве лежит объект с полем max_id, которое может быть строкой или числом
			const listRows = maxListIdResult.rows as { max_id: string | number | null }[];

			// 2. Безопасно достаем max_id через индекс первой строки
			let nextListId = Number(listRows[0]?.max_id || 0) + 1;

			for (const item of data.cartridgesList) {
				const cartridgeCheck = await this.databaseService.query(
					`SELECT id FROM cartridges WHERE model = $1 LIMIT 1`,
					[item.model]
				) as { rows: { id: number }[] };

				if (cartridgeCheck.rows.length > 0) {
					const cartridgeId = cartridgeCheck.rows[0].id;

					for (let i = 0; i < item.count; i++) {
						// 2. Добавляем столбец id и параметр $1 в запрос вставки связующей таблицы
						await this.databaseService.query(
							`
							INSERT INTO requestslist (id, requestid, cartridgeid)
							VALUES ($1, $2, $3)
							`,
							[nextListId, newRequestId, cartridgeId]
						);

						// После каждой вставки увеличиваем счетчик на 1, чтобы ID не повторялись
						nextListId++;
					}
				}
			}
		}

		return { success: true, requestId: newRequestId };
	}
}
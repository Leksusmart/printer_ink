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

		const dbResult = await this.databaseService.query(`SELECT guid FROM cartridges`);
		// Превращаем в Set для мгновенного поиска за O(1)
		const existingGUIDs = new Set(
			dbResult.rows.map((row: any) => row.guid?.toLowerCase())
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


}

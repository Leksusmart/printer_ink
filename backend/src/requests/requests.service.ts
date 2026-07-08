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

}

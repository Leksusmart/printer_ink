/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// Сервис для работы с картриджами (получение списка из базы данных)
// Структура
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

@Injectable()
export class CartridgesService {
	constructor(private readonly databaseService: DatabaseService) { }

	async findAll(): Promise<Cartridge[]> {
		const result = await this.databaseService.query(
			`
	  SELECT *
	  FROM cartridges
	  ORDER BY Model
	  `,
		);

		return result.rows;
	}

	async findByGuid(guid: string): Promise<Cartridge | null> {
		const result = await this.databaseService.query(
			`
	  SELECT *
	  FROM cartridges
	  WHERE guid = $1
	  `,
			[guid],
		);

		if (result.rows.length === 0) {
			return null;
		}

		return result.rows[0];
	}

	async changeStatusTo(guid: string, newStatus: string): Promise<{ success: boolean; }> {
		try {
			const result = await this.databaseService.query(
				`
				UPDATE cartridges
				SET status = $1
				WHERE guid = $2;
				`,
				[newStatus, guid],
			);
			// Если result.rowCount равен null или undefined, подставится 0
			const rowCount = result.rowCount ?? 0;
			const success = rowCount > 0;

			return { success };

		} catch (error) {
			console.error("Ошибка при изменении статуса картриджа:", error);

			return { success: false, };
		}
	}
}


/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class EmployersService {
	constructor(private readonly databaseService: DatabaseService) {}

	async findAll(): Promise<{ id: number; phone: string; fullname: string; role: string }[]> {
		const result = await this.databaseService.query(
			`
			SELECT *
			FROM Employers
			ORDER BY phone
			`,
		);

		// Возвращаем массив строк
		return result.rows;
	}

	async findByPhone(phone: string): Promise<{ id: number; phone: string; fullname: string; role: string } | null> {
		// функция достаёт из базы информацию о сотруднике по номеру телефона
		const result = await this.databaseService.query(
			`
			SELECT *
			FROM employers 
			WHERE phone = $1
			`,
			[phone],
		);

		// Если в базе ничего не нашлось, возвращаем null
		if (result.rows.length === 0) {
			return null;
		}

		return result.rows[0];
	}
}

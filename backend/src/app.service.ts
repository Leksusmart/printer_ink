/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/*
 * НАЗНАЧЕНИЕ ФАЙЛА:
 * Это файл Сервиса (Service), также называемый Провайдером (Provider).
 * Он отвечает за бизнес-логику приложения: обработку данных, работу с базами данных и вычисления.
 * Контроллеры вызывают методы этого сервиса, чтобы не выполнять сложную работу самостоятельно.
 */

import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service';

// Декоратор Injectable говорит NestJS, что этот класс можно автоматически внедрять в другие классы (например, в контроллеры)
@Injectable()
export class AppService {
	// Внедряем сервис БД через конструктор
	constructor(private readonly databaseService: DatabaseService) { }

	// Простой метод, который возвращает строку. Здесь должна быть логика (например, запрос к БД)
	getHello(): string {
		return 'Hello World!';
	}

	async findAll(): Promise<{ id: number; phone: string; fullname: string; role: string }[]> {
		const result = await this.databaseService.query(
			`
			SELECT
				id,
				phone,
				fullname,
				role
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
    SELECT id, phone, fullname, role 
    FROM Employers 
    WHERE phone = $1
    LIMIT 1
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

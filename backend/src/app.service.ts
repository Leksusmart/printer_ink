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

}

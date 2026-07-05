/* eslint-disable prettier/prettier */
/**
 * НАЗНАЧЕНИЕ ФАЙЛА:
 * Это главная точка входа (entry point) в приложение NestJS.
 * Файл отвечает за инициализацию, сборку и запуск всего веб-сервера.
 * Он создает экземпляр приложения на основе корневого модуля и запускает прослушивание портов.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config'; // Импортируем встроенную службу конфигурации

// Основная функция для инициализации и запуска сервера
async function bootstrap() {
	// 1. Создаем экземпляр приложения NestJS
	const app = await NestFactory.create(AppModule);

	// 2. Получаем ConfigService из контекста приложения
	const configService = app.get(ConfigService);

	// 3. Читаем порт из переменных окружения и преобразуем в число
	const port = Number(configService.get<number>('PORT')) || 3000;

	// 3.5. Читаем хост из переменных окружения. Если пусто — используем '0.0.0.0'
	const host = configService.get<string>('HOST') || '0.0.0.0';

	// 4. Запускаем сервер на определенном порту и хосте
	await app.listen(port, host);

	// Корректно выводим адрес в консоль (если хост 0.0.0.0, пишем localhost (одно и тоже))
	const displayHost = host === '0.0.0.0' ? 'localhost' : host;
	console.log(`Application is running on: http://${displayHost}:${port}`);
}

// Вызываем функцию bootstrap для фактического старта приложения при запуске файла
bootstrap();

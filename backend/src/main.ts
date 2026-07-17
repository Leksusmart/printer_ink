import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

// Основная функция для инициализации и запуска сервера
async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	const configService = app.get(ConfigService); // Читаем .env

	app.enableCors();

	const PORT = Number(configService.get<number>('PORT_BACKEND'));

	await app.listen(PORT, '0.0.0.0'); // Docker слушает все входящие соединения на порт
}

bootstrap();

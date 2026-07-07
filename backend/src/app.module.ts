/* eslint-disable prettier/prettier */
/**
 * НАЗНАЧЕНИЕ ФАЙЛА:
 * Это Корневой Модуль (Root Module) приложения.
 * Он служит главным организующим центром и собирает воедино все части приложения.
 * Здесь NestJS узнаёт, какие контроллеры обрабатывают запросы, какие сервисы выполняют логику,
 * и какие другие модули нужно подключить для работы проекта.
 */

// Импортируем декоратор Module для конфигурации класса как модуля NestJS
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // .env обработка
// Импортируем контроллер, который будет отвечать за обработку HTTP-запросов
import { AppController } from './app.controller';
// Импортируем сервис, который содержит бизнес-логику для этого модуля
import { AppService } from './app.service';

import { DatabaseModule } from './database/database.module';
import { DatabaseService } from './database/database.service';

import { CartridgesModule } from './cartridges/cartridges.module';
import { CartridgesController } from './cartridges/cartridges.controller';
import { CartridgesService } from './cartridges/cartridges.service';

import { EmployersModule } from './employers/employers.module';
import { EmployersController } from './employers/employers.controller';
import { EmployersService } from './employers/employers.service';

// Декоратор Module настраивает структуру текущего модуля с помощью специальных массивов
@Module({
  // imports: список других модулей, чьи возможности (сервисы) нужны внутри этого модуля
    // Найдите массив imports и дополните настройку ConfigModule:
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', 'backend/.env', './backend/.env'] // ДОБАВИЛИ ЭТУ СТРОКУ
        }),
        DatabaseModule,
        CartridgesModule,
        EmployersModule,
    ],


  // controllers: список контроллеров, которые создаются и запускаются внутри этого модуля
  controllers: [
    AppController,
    CartridgesController,
    EmployersController,
  ],
  // providers: список сервисов, которые NestJS создаст и сможет автоматически внедрять (DI)
  providers: [
    AppService,
    DatabaseService,
    CartridgesService,
    EmployersService,
  ],
})
// Пустой класс, который становится модулем благодаря декоратору выше
export class AppModule {}

/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// Сервис для работы с PostgreSQL (подключение к БД и выполнение запросов)

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Импортируем встроенную службу конфигурации
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
    private pool: Pool;

    constructor(private readonly configService: ConfigService) {
        this.pool = new Pool({
            // Если процесс запущен в Docker, process.env.DB_HOST возьмется из docker-compose
            host: process.env.DB_HOST || this.configService.get<string>('DB_HOST') || 'localhost',
            port: Number(process.env.DB_PORT || this.configService.get<number>('DB_PORT') || 5432),
            database: process.env.DB_NAME || this.configService.get<string>('DB_NAME'),
            user: process.env.DB_USER || this.configService.get<string>('DB_USER'),
            password: process.env.DB_PASSWORD || this.configService.get<string>('DB_PASSWORD'),
        });
    }


    async query(sql: string, params?: any[]) {
        return this.pool.query(sql, params);
    }

    // закрываем пул подключений при остановке сервера
    async onModuleDestroy() {
        await this.pool.end();
    }
}

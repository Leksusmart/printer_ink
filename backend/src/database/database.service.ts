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
            host: this.configService.get<string>('DB_HOST'),
            port: Number(this.configService.get<number>('DB_PORT')),
            database: this.configService.get<string>('DB_NAME'),
            user: this.configService.get<string>('DB_USER'),
            password: this.configService.get<string>('DB_PASSWORD'),
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
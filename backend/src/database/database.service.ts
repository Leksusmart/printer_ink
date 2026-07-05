// Сервис для работы с PostgreSQL (подключение к БД и выполнение запросов)

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Импортируем встроенную службу конфигурации
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
    private pool: Pool;

    // Внедряем ConfigService через конструктор. Он гарантирует, что .env уже прочитан!
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

    // Хорошая практика: закрываем пул подключений при остановке сервера
    async onModuleDestroy() {
        await this.pool.end();
    }
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      host: process.env.DB_HOST || this.configService.get<string>('DB_HOST') || 'localhost',
      port: Number(process.env.DB_PORT || this.configService.get<number>('DB_PORT') || 5432),
      database: process.env.DB_NAME || this.configService.get<string>('DB_NAME'),
      user: process.env.DB_USER || this.configService.get<string>('DB_USER'),
      password: process.env.DB_PASSWORD || this.configService.get<string>('DB_PASSWORD'),
    });
  }

  async query(sql: string, params?: any[]) {
    try {
      return await this.pool.query(sql, params);
    } catch (error) {
      console.error('Database query error:', sql, error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { DatabaseService } from './database.service';

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: 'DATABASE_POOL',
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                return new Pool({
                    host: configService.get<string>('DB_HOST'),
                    port: Number(configService.get<number>('DB_PORT')),
                    database: configService.get<string>('DB_DATABASE'),
                    user: configService.get<string>('DB_USERNAME'),
                    password: configService.get<string>('DB_PASSWORD'),
                });
            },
        },
        DatabaseService,
    ],
    exports: ['DATABASE_POOL', DatabaseService],
})
export class DatabaseModule { }

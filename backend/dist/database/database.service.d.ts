import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class DatabaseService implements OnModuleDestroy {
    private readonly configService;
    private pool;
    constructor(configService: ConfigService);
    query(sql: string, params?: any[]): Promise<import("pg").QueryResult<any>>;
    onModuleDestroy(): Promise<void>;
}

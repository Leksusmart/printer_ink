import { DatabaseService } from './database/database.service';
export declare class AppService {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    getHello(): string;
    findAll(): Promise<{
        id: number;
        phone: string;
        fullname: string;
        role: string;
    }[]>;
    findByPhone(phone: string): Promise<{
        id: number;
        phone: string;
        fullname: string;
        role: string;
    } | null>;
}

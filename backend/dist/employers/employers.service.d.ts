import { DatabaseService } from '../database/database.service';
export declare class EmployersService {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
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

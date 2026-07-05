export interface Cartridge {
    id: number;
    model: string;
    guid: string;
    status: string;
    isdefective: boolean;
    lastchangedata: Date;
    lastchangeby: number;
}
import { DatabaseService } from '../database/database.service';
export declare class CartridgesService {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    findAll(): Promise<Cartridge[]>;
    findByGuid(guid: string): Promise<Cartridge | null>;
}

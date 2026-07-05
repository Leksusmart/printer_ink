import { CartridgesService } from './cartridges.service';
export declare class CartridgesController {
    private readonly cartridgesService;
    constructor(cartridgesService: CartridgesService);
    findAll(): Promise<import("./cartridges.service").Cartridge[]>;
    searchByGuid(guid: string): Promise<import("./cartridges.service").Cartridge>;
}

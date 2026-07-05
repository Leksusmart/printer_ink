import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): Promise<{
        id: number;
        phone: string;
        fullname: string;
        role: string;
    }[]>;
    checkPhone(phone: string): Promise<{
        id: number;
        phone: string;
        fullname: string;
        role: string;
    }>;
}

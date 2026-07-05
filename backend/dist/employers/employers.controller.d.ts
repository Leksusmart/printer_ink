import { EmployersService } from '../employers/employers.service';
export declare class EmployersController {
    private readonly EmployersService;
    constructor(EmployersService: EmployersService);
    findAll(): Promise<{
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

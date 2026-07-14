/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    // Эндпоинт для верхних карточек и блоков статистики: GET /admin/stats
    @Get('stats')
    async getStats() {
        return this.adminService.getDashboardStats();
    }

    @Get('history') async getHistory() { return this.adminService.getHistoryLogs(); }
    @Get('refill') async getRefill() { return this.adminService.getRefillRequests(); }
    @Get('repair') async getRepair() { return this.adminService.getRepairRequests(); }


    @Post('create-user')
    async createEmployer(@Body() body: any) {
        return this.adminService.createEmployer(body.fullname, body.phone, body.role, body.password);
    }

    @Get('generate-guid')
    async generateGuid() {
        const generatedGuid = await this.adminService.getNewGUID();
        return { guid: generatedGuid };
    }

    @Post('create-cartridge')
    async createCartridge(@Body() body: { model: string; guid: string; status: string; isdefective: boolean; adminId: number | null }) {
        return this.adminService.createCartridgeInDb(body.model, body.guid, body.status, body.isdefective, body.adminId);
    }
    @Post('scrap-cartridge')
    async scrapCartridge(@Body() body: { guid: string }) {
        return this.adminService.scrapCartridgeByGuid(body.guid);
    }

    // GET-роут для чтения: http://localhost:3000/admin/settings
    @Get('settings')
    async getSettings() {
        return this.adminService.getSettings();
    }

    // POST-роут для сохранения: http://localhost:3000/admin/settings
    @Post('settings')
    async updateSettings(@Body() body: any) {
        return this.adminService.updateSettings(body);
    }
}

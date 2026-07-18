import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    // Эндпоинт для верхних карточек и блоков статистики
    @Get('stats')
    async getStats() {
        return this.adminService.getStats();
    }

    @Get('history') async getHistory() { return this.adminService.getHistoryLogs(); }

    // Объединённая вкладка "Заявки на заправку/ремонт"
    @Get('refill-repair') async getRefillRepair() { return this.adminService.getRefillRepairRequests(); }

    // Вкладка "Заявки на приёмку"
    @Get('receiving') async getReceiving() { return this.adminService.getReceivingRequests(); }

    // Вкладка "Заявки на списание"
    @Get('scrap-requests') async getScrapRequests() { return this.adminService.getScrapRequests(); }

    // Вкладка "Заявки на получение"
    @Get('issuance') async getIssuance() { return this.adminService.getIssuanceRequests(); }

    // Картриджи (модель + GUID) конкретной заявки
    @Get('request/:id/cartridges')
    async getRequestCartridges(@Param('id') id: string) {
        return this.adminService.getCartridgesForRequest(parseInt(id, 10));
    }

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
    async createCartridge(@Body() body: { model: string; guid: string; status: string; isdefective: boolean; adminId: number | null, comment: string }) {
        return this.adminService.createCartridge(body.model, body.guid, body.status, body.isdefective, body.adminId, body.comment);
    }
    @Post('scrap-cartridge')
    async scrapCartridge(@Body() body: { guid: string }) {
        return this.adminService.scrapCartridgeByGuid(body.guid);
    }

    @Get('settings')
    async getSettings() {
        return this.adminService.getSettings();
    }

    @Post('settings')
    async updateSettings(@Body() body: any) {
        return this.adminService.updateSettings(body);
    }
}

import { Controller, Get, Post, Delete, Body, Param, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    // Эндпоинт для верхних карточек и блоков статистики
    @Get('stats') async getStats() { return this.adminService.getStats(); }

    @Get('requests') async getRequests() { return this.adminService.getRequests(); }

    @Get('cartridges') async getCartridges() { return this.adminService.getCartridges(); }

    @Get('employers') async getEmployers() { return this.adminService.getEmployers(); }

    // Картриджи (модель + GUID) конкретной заявки
    @Get('request/:id/cartridges')
    async getRequestCartridges(@Param('id') id: string) {
        return this.adminService.getCartridgesForRequest(parseInt(id, 10));
    }

    @Post('create-user')
    async createEmployer(@Body() body: any) { return this.adminService.createEmployer(body.fullname, body.phone, body.role, body.password); }

    @Delete('delete-user')
    async deleteUser(@Body() body: { identifier: string | number; adminId: number; force?: boolean }) {
        const { identifier, adminId, force } = body;

        if (!identifier) {
            throw new BadRequestException('ID пользователя (identifier) обязателен');
        }
        if (!adminId) {
            throw new BadRequestException('ID администратора (adminId) обязателен');
        }

        return await this.adminService.deleteEmployerById(identifier, adminId, !!force);
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
    async scrapCartridge(@Body() body: { guid: string, adminId:number }) { return this.adminService.scrapCartridgeByGuid(body.guid, body.adminId); }

    @Post('change-cartridge-status')
    async changeCartridgeStatus(@Body() body: { guid: string; status: string; adminId: number; comment?: string }) {
        if (!body.guid || !body.status) {
            throw new BadRequestException('guid и status обязательны');
        }
        if (!body.adminId) {
            throw new BadRequestException('ID администратора (adminId) обязателен');
        }
        return this.adminService.changeCartridgeStatus(body.guid, body.status, body.adminId, body.comment);
    }

    @Get('settings')
    async getSettings() { return this.adminService.getSettings(); }

    @Post('settings') async updateSettings(@Body() body: any) { }
}

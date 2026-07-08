/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Get, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { RequestsService } from '../requests/requests.service';

@Controller('Requests')
export class RequestsController {
	constructor(private readonly RequestsService:RequestsService) {}

  @Get()
  async findAll() {
	  return this.RequestsService.findAll();
  }

	@Get('search')
    async searchByGuid(@Query('guid') guid: string) {
        if (!guid) {
            throw new BadRequestException('Параметр guid обязателен, Бэк ожидает /requests/search?guid=...');
        }

        const request = await this.RequestsService.findRequestByGuid(guid);

        if (!request) {
            throw new NotFoundException(`Заявка связанная с GUID "${guid}" не найдена`);
        }

        return request;
    }
}

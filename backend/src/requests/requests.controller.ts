/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Get, Post, Body, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { RequestsService } from '../requests/requests.service';
import { CreateRequestDto } from './dto/create-request.dto';

@Controller('requests')
export class RequestsController {
    constructor(private readonly requestsService: RequestsService) { }

    @Get()
    async findAll() {
        return this.requestsService.findAll();
    }

    @Post()
    async create(@Body() createRequestDto: CreateRequestDto) {
        const result = await this.requestsService.createRequest(createRequestDto);
        return result;
    }

    @Get('search')
    async searchByGuid(@Query('guid') guid: string) {
        if (!guid) {
            throw new BadRequestException('Параметр guid обязателен, Бэк ожидает /requests/search?guid=...');
        }

        const request = await this.requestsService.findRequestByGuid(guid);

        if (!request) {
            throw new NotFoundException(`Заявка связанная с GUID "${guid}" не найдена`);
        }

        return request;
    }
}

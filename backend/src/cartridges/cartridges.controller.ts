/* eslint-disable prettier/prettier */
// Контроллер для работы с картриджами (обрабатывает GET /cartridges)

import { Controller, Get, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { CartridgesService } from './cartridges.service';

@Controller('cartridges')
export class CartridgesController {
  constructor(private readonly cartridgesService: CartridgesService) {}

  @Get()
  async findAll() {
    return this.cartridgesService.findAll();
  }

  @Get('search')
  async searchByGuid(@Query('guid') guid: string) {
    if (!guid) {
      throw new BadRequestException('Параметр guid обязателен, Бэк ожидает /cartridges/search?guid=...');
    }

    const cartridge = await this.cartridgesService.findByGuid(guid);

    if (!cartridge) {
      throw new NotFoundException(`Картридж с GUID "${guid}" не найден`);
    }

    return cartridge;
  }
}

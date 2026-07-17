import { Controller, Get, Post, Body, Query, NotFoundException, UsePipes, ValidationPipe } from '@nestjs/common';
import { CartridgesService } from './cartridges.service';
import { CreateCartridgeDto } from './dto/create-cartridge.dto';
import { GuidQueryDto } from './dto/guid-query.dto';

@Controller('cartridges')
export class CartridgesController {
    constructor(private readonly cartridgesService: CartridgesService) { }

    @Get()
    async findAll() {
        return this.cartridgesService.findAll();
    }

    @Get('search')
    @UsePipes(new ValidationPipe({ transform: true }))
    async searchByGuid(@Query() query: GuidQueryDto) {
        const cartridge = await this.cartridgesService.findByGuid(query.guid);

        if (!cartridge) {
            throw new NotFoundException(`Картридж с GUID "${query.guid}" не найден`);
        }

        return cartridge;
    }

    @Post()
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async create(@Body() createCartridgeDto: CreateCartridgeDto) {
        return this.cartridgesService.create(createCartridgeDto);
    }
}

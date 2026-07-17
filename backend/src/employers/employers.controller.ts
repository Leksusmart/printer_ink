import * as bcrypt from 'bcrypt';
import { Controller, Get, Post, Body, Query, NotFoundException, UnauthorizedException, UsePipes, ValidationPipe } from '@nestjs/common';
import { EmployersService } from './employers.service';
import { CreateEmployerDto } from './dto/create-employer.dto';
import { PhoneQueryDto } from './dto/phone-query.dto';
import { normalizePhone } from '../utils/phone.helper'

@Controller('employers')
export class EmployersController {
    constructor(private readonly employersService: EmployersService) { }

    @Get()
    async findAll() {
        return this.employersService.findAll();
    }

    @Get('search')
    @UsePipes(new ValidationPipe({ transform: true }))
    async checkPhone(@Query() query: PhoneQueryDto) {
        const employer = await this.employersService.findByPhone(query.phone);

        if (!employer) {
            throw new NotFoundException('Сотрудник с таким номером не найден');
        }

        return employer;
    }

    @Post('login')
    async login(@Body() body: { phone: string; password?: string }) {
        let checkedPhone = normalizePhone(body.phone);

        const employer = await this.employersService.findByPhone(checkedPhone);

        if (!employer) {
            throw new UnauthorizedException(`Сотрудник с номером не найден`);
        }

        // Для клиента (без пароля) — пропускаем проверку пароля
        if (body.password) {

            if (employer.role !== 'Admin') {
                throw new UnauthorizedException('У вас нет прав администратора');
            }

            const isPasswordMatching = await bcrypt.compare(body.password, employer.password!);
            if (!isPasswordMatching) {
                throw new UnauthorizedException('Неверный пароль');
            }
        } else return employer;

        const { password, ...result } = employer;
        return result;
    }

    @Post()
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async create(@Body() createEmployerDto: CreateEmployerDto) {
        return this.employersService.create(createEmployerDto);
    }
}

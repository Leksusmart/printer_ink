/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as bcrypt from 'bcrypt';
import { Controller, Get, Post, Body, Query, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { EmployersService } from '../employers/employers.service';

@Controller('Employers')
export class EmployersController {
    constructor(private readonly EmployersService: EmployersService) { }

    @Get()
    async findAll() {
        return this.EmployersService.findAll();
    }

    @Get('search')
    async checkPhone(@Query('phone') phone: string) {
        // Создаем изменяемую копию строки, убрав лишние пробелы по краям
        let checkedPhone = phone.trim();
        if (checkedPhone.length === 11 && checkedPhone.startsWith('7')) {
            // Меняем первый пробел на плюс
            checkedPhone = '+' + checkedPhone;
        } else if (checkedPhone.length === 11 && checkedPhone.startsWith('8')) {
            // Меняем '8' на '+7'
            checkedPhone = '+7' + checkedPhone.slice(1);
        }
        if (!checkedPhone) {
            throw new NotFoundException('Параметр phone обязателен, Бэк ожидает /employers/search?phone=+79008000010');
        }

        const employer = await this.EmployersService.findByPhone(checkedPhone);

        if (!employer) {
            throw new NotFoundException('Сотрудник с таким номером не найден');
        }

        return employer;
    }

    @Post('admin-login')
    async adminLogin(@Body() body: { phone: string; password?: string }) {
        let checkedPhone = body.phone.trim();

        if (checkedPhone.length === 11 && checkedPhone.startsWith('7')) {
            checkedPhone = '+' + checkedPhone;
        } else if (checkedPhone.length === 11 && checkedPhone.startsWith('8')) {
            checkedPhone = '+7' + checkedPhone.slice(1);
        }

        const employer = await this.EmployersService.findByPhone(checkedPhone);

        if (!employer) {
            throw new UnauthorizedException('Неверный телефон или пароль');
        }

        // Проверяем роль (Разрешено только Admin)
        if (employer.role !== 'Admin') {
            throw new UnauthorizedException('У вас нет прав администратора');
        }

        // Проверяем, задан ли вообще пароль у этого пользователя в БД
        if (!employer.password || !body.password) {
            throw new UnauthorizedException('Неверный телефон или пароль');
        }

        // Безопасное сравнение введенного пароля с хэшем из БД
        // Метод сам расшифрует хэш и сравнит соль, возвращает true или false
        const isPasswordMatching = await bcrypt.compare(body.password, employer.password);

        if (!isPasswordMatching) {
            throw new UnauthorizedException('Неверный телефон или пароль');
        }

        const { password, ...result } = employer;
        return result;
    }
}

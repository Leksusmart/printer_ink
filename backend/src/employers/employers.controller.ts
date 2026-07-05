/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Get, Query, NotFoundException } from '@nestjs/common';
import { EmployersService } from '../employers/employers.service';

@Controller('Employers')
export class EmployersController {
  constructor(private readonly EmployersService: EmployersService) {}

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
}

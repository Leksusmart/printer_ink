import * as bcrypt from 'bcrypt';
import { Controller, Get, Post, Body, Query, NotFoundException, UnauthorizedException, UsePipes, ValidationPipe } from '@nestjs/common';
import { EmployersService } from './employers.service';
import { CreateEmployerDto } from './dto/create-employer.dto';
import { PhoneQueryDto } from './dto/phone-query.dto';

@Controller('employers')
export class EmployersController {
  constructor(private readonly employersService: EmployersService) {}

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

  @Post('admin-login')
  async adminLogin(@Body() body: { phone: string; password?: string }) {
    let checkedPhone = body.phone.trim();

    if (checkedPhone.length === 11 && checkedPhone.startsWith('7')) {
      checkedPhone = '+' + checkedPhone;
    } else if (checkedPhone.length === 11 && checkedPhone.startsWith('8')) {
      checkedPhone = '+7' + checkedPhone.slice(1);
    }

    const employer = await this.employersService.findByPhone(checkedPhone);

    if (!employer) {
      throw new UnauthorizedException('Неверный телефон или пароль');
    }

    if (employer.role !== 'Admin') {
      throw new UnauthorizedException('У вас нет прав администратора');
    }

    if (!employer.password || !body.password) {
      throw new UnauthorizedException('Неверный телефон или пароль');
    }

    const isPasswordMatching = await bcrypt.compare(body.password, employer.password!);

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Неверный телефон или пароль');
    }

    const { password, ...result } = employer;
    return result;
  }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() createEmployerDto: CreateEmployerDto) {
    return this.employersService.create(createEmployerDto);
  }
}

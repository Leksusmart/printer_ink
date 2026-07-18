import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';
import { normalizePhone } from '../utils/phone.helper'
export interface Employer {
  id: number;
  phone: string;
  fullname: string;
  role: string;
  password?: string;
}

@Injectable()
export class EmployersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(): Promise<Employer[]> {
    const result = await this.databaseService.query(`
      SELECT *
      FROM public.employers
    `);
    return result.rows;
  }

  async findByPhone(phone: string): Promise<Employer | null> {
    const normalizedPhone = normalizePhone(phone);
    const result = await this.databaseService.query(`
      SELECT *
      FROM public.employers 
      WHERE phone = $1
    `, [normalizedPhone]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  async create(createDto: { fullname: string; phone: string; role?: string; password?: string }): Promise<Employer> {
    const { fullname, phone, role = 'User', password } = createDto;

    if (!phone || !fullname) {
      throw new BadRequestException('Телефон и ФИО обязательны');
    }

      const normalizedPhone = normalizePhone(phone);

    const exists = await this.databaseService.query(
      'SELECT id FROM public.employers WHERE phone = $1', 
      [normalizedPhone]
    );
    if (exists.rows.length > 0) {
      throw new BadRequestException('Пользователь с таким телефоном уже существует');
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const result = await this.databaseService.query(`
      INSERT INTO public.employers (phone, fullname, role, password)
      VALUES ($1, $2, $3, $4)
      RETURNING id, phone, fullname, role
    `, [normalizedPhone, fullname.trim(), role, hashedPassword]);

    return result.rows[0];
  }
}

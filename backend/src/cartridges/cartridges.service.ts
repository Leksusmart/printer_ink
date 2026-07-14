/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */

import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface Cartridge {
  id: number;
  model: string;
  guid: string;
  status: string;
  isdefective: boolean;
  lastchangedata: Date;
  lastchangeby: number;
}

@Injectable()
export class CartridgesService {
  constructor(private readonly databaseService: DatabaseService) { }

  async findAll(): Promise<Cartridge[]> {
    const result = await this.databaseService.query(`
      SELECT *
      FROM public.cartridges
      ORDER BY lastchangedata DESC
    `);

    return result.rows;
  }

  async findByGuid(guid: string): Promise<Cartridge | null> {
    const result = await this.databaseService.query(`
      SELECT *
      FROM public.cartridges
      WHERE guid = $1
    `, [guid]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  async create(createDto: { model: string; guid: string; status?: string; isdefective?: boolean; lastchangeby?: number }): Promise<Cartridge> {
    const { model, guid, status = 'Ожидает заправки', isdefective = false, lastchangeby } = createDto;

    if (!model || !guid) {
      throw new BadRequestException('Модель и GUID обязательны');
    }

    const result = await this.databaseService.query(`
      INSERT INTO public.cartridges (model, guid, status, isdefective, lastchangeby)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [model.trim(), guid.trim(), status, isdefective, lastchangeby]);

    return result.rows[0];
  }

  async changeStatusesTo(guids: string[], newStatus: string): Promise<{ success: boolean; }> {
    try {
      if (!guids || guids.length === 0) {
        return { success: false };
      }

      const result = await this.databaseService.query(`
        UPDATE public.cartridges
        SET status = $1
        WHERE guid = ANY($2);
      `, [newStatus, guids]);

      const rowCount = result.rowCount ?? 0;
      return { success: rowCount > 0 };
    } catch (error) {
      console.error('Ошибка при массовом изменении статуса картриджей:', error);
      return { success: false };
    }
  }
}

// Модуль картриджей (объединяет контроллер, сервис и импортирует DatabaseModule)

import { Module } from '@nestjs/common';
import { CartridgesController } from './cartridges.controller';
import { CartridgesService } from './cartridges.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CartridgesController],
  providers: [CartridgesService],
  exports: [CartridgesService],
})
export class CartridgesModule {}

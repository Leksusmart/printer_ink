import { Module } from '@nestjs/common';
import { RequestsController } from '../requests/requests.controller';
import { RequestsService } from '../requests/requests.service';
import { DatabaseModule } from '../database/database.module';
import { CartridgesModule } from '../cartridges/cartridges.module';
@Module({
  imports: [DatabaseModule, CartridgesModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}

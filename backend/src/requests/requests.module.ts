import { Module, forwardRef } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { DatabaseModule } from '../database/database.module';
import { CartridgesModule } from '../cartridges/cartridges.module';
import { AdminModule } from '../admin/admin.module';

@Module({
    imports: [
        DatabaseModule,
        CartridgesModule,
        forwardRef(() => AdminModule) // Защита от циклической зависимости
    ],
    controllers: [RequestsController],
    providers: [RequestsService],
    exports: [RequestsService],
})
export class RequestsModule { }

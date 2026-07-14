/* eslint-disable prettier/prettier */
import { Module, forwardRef } from '@nestjs/common'
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DatabaseModule } from '../database/database.module';
import { RequestsModule } from '../requests/requests.module';
import { CartridgesModule } from '../cartridges/cartridges.module';

@Module({
    imports: [
        DatabaseModule,
        CartridgesModule,
        forwardRef(() => RequestsModule) // защита от циклической зависимости
    ],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule { }

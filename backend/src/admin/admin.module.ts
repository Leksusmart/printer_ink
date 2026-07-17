import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DatabaseModule } from '../database/database.module';
import { CartridgesModule } from '../cartridges/cartridges.module';

@Module({
    imports: [
        DatabaseModule,
        CartridgesModule
    ],
    controllers: [AdminController],
    providers: [AdminService]
})
export class AdminModule { }

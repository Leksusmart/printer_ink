import { Module, forwardRef } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { DatabaseModule } from '../database/database.module';
import { CartridgesModule } from '../cartridges/cartridges.module';

@Module({
    imports: [
        DatabaseModule,
        CartridgesModule
    ],
    controllers: [RequestsController],
    providers: [RequestsService]
})
export class RequestsModule { }

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { CartridgesModule } from './cartridges/cartridges.module';
import { DatabaseModule } from './database/database.module';
import { EmployersModule } from './employers/employers.module';
import { RequestsModule } from './requests/requests.module';


@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        AdminModule,
        CartridgesModule,
        DatabaseModule,
        EmployersModule,
        RequestsModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }

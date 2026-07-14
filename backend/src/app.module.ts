import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { EmployersModule } from './employers/employers.module';
import { CartridgesModule } from './cartridges/cartridges.module';
import { RequestsModule } from './requests/requests.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    EmployersModule,
    CartridgesModule,
    RequestsModule,
    AdminModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

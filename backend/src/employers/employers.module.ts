import { Module } from '@nestjs/common';
import { EmployersController } from '../employers/employers.controller';
import { EmployersService } from '../employers/employers.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [EmployersController],
    providers: [EmployersService],
})
export class EmployersModule { }

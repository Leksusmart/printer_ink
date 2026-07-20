import { IsString, IsBoolean, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class NewCartridgeDto {
    @IsString()
    model: string;

    @IsNumber()
    amount: number;
}
export class CreateRequestDto {
    @IsString()
    type: string;

    @IsBoolean()
    @IsOptional()
    isDefective?: boolean;

    @IsString()
    @IsOptional()
    status?: string;

    @IsNumber()
    employeeID: number;

    @IsString()
    @IsOptional()
    comment?: string;

    @IsString()
    @IsOptional()
    model?: string;

    @IsNumber()
    @IsOptional()
    amount?: number;

    @IsString()
    @IsOptional()
    guid?: string;

    @IsArray()
    @IsOptional()
    guids?: string[];

    @IsOptional() // добавьте, если поле newCartridges не всегда обязательно
    @ValidateNested() // заставляет валидировать вложенный класс
    @Type(() => NewCartridgeDto) // указывает class-transformer, в какой класс преобразовать объект
    newCartridges?: NewCartridgeDto;
}

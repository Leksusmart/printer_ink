import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateCartridgeDto {
    @IsString()
    @IsNotEmpty({ message: 'Модель картриджа обязательна' })
    model: string;

    @IsString()
    @IsNotEmpty({ message: 'GUID обязателен' })
    guid: string;

    @IsString()
    @IsOptional()
    status?: string = 'Ожидает заправки';

    @IsBoolean()
    @IsOptional()
    isdefective?: boolean = false;

    @IsString()
    @IsNotEmpty({ message: 'ID Сотрудника обязателен' })
    lastchangeby: number;
}

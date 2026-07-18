import { IsString, IsBoolean, IsNumber, IsOptional, IsArray } from 'class-validator';

export class CreateRequestDto {
    @IsString()
    type: string;

    @IsBoolean()
    @IsOptional()
    isDefective?: boolean;

    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    data: string;

    @IsNumber()
    employeeID: number;

    @IsString()
    lastChangeData: string;

    @IsNumber()
    lastChangeBy: number;

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
}

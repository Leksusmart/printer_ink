import { IsString, IsNotEmpty, IsOptional, IsEnum, Matches } from 'class-validator';

export enum EmployerRole {
  Admin = 'Admin',
  User = 'User',
}

export class CreateEmployerDto {
  @IsString()
  @IsNotEmpty({ message: 'ФИО обязательно' })
  fullname: string;

  @IsString()
  @IsNotEmpty({ message: 'Телефон обязателен' })
  @Matches(/^\+?[78]\d{10}$/, { message: 'Телефон в формате +7XXXXXXXXXX или 8XXXXXXXXXX' })
  phone: string;

  @IsEnum(EmployerRole)
  @IsOptional()
  role?: EmployerRole = EmployerRole.User;

  @IsString()
  @IsOptional()
  password?: string;
}

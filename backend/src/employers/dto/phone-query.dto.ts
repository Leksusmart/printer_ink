import { IsString, IsNotEmpty } from 'class-validator';

export class PhoneQueryDto {
  @IsString()
  @IsNotEmpty()
  phone: string;
}

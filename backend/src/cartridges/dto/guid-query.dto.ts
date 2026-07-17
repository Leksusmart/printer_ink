import { IsString, IsNotEmpty } from 'class-validator';

export class GuidQueryDto {
    @IsString()
    @IsNotEmpty()
    guid: string;
}

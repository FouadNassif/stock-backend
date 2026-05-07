import { IsOptional, IsString } from 'class-validator';

export class RegisterQueryDto {
    @IsOptional()
    @IsString()
    ref?: string;
}
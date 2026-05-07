import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    fullName!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @IsNotEmpty()
    nationalId!: string;

    @IsDateString()
    dateOfBirth!: string;
}
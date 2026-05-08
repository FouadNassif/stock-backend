import { IsEmail, IsString, MinLength } from 'class-validator';
import { AdminRole } from '../schemas/admin.schema';
export class CreateAdminDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(3)
    fullName!: string;

    @IsString()
    role!: AdminRole;
}
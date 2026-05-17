import { IsString, Length } from 'class-validator';

export class VerifyResetOtpDto {
    @IsString()
    verificationId!: string;

    @IsString()
    @Length(6, 6)
    code!: string;
}
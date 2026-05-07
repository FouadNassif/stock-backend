import { IsString, IsUUID, Length } from 'class-validator';

export class VerifyOtpDto {
    @IsUUID()
    verificationId!: string;

    @IsString()
    @Length(6, 6)
    code!: string;
}
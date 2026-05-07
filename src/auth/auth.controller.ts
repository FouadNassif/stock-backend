import { Body, Controller, Post, Query } from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterQueryDto } from './dto/register-query.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    register(
        @Body() dto: RegisterDto,
        @Query() query: RegisterQueryDto,
    ): Promise<{ memberId: string; verificationId: string; message: string }> {
        return this.authService.register(dto, query.ref);
    }

    @Post('verify-otp')
    verifyOtp(@Body() dto: VerifyOtpDto): Promise<{ message: string }> {
        return this.authService.verifyOtp(dto);
    }

    @Post('resend-otp')
    resendOtp(
        @Body() dto: ResendOtpDto,
    ): Promise<{ verificationId: string; message: string }> {
        return this.authService.resendOtp(dto);
    }

    @Post('set-password')
    setPassword(@Body() dto: SetPasswordDto): Promise<{ message: string }> {
        return this.authService.setPassword(dto);
    }

    @Post('login')
    login(@Body() dto: LoginDto): Promise<{ accessToken: string }> {
        return this.authService.login(dto);
    }
}
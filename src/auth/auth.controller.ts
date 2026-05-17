import { Body, Controller, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterQueryDto } from './dto/register-query.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body() dto: RegisterDto,
    @Query() query: RegisterQueryDto,
    @Req() req: Request,
  ): Promise<{ memberId: string; verificationId: string; message: string }> {
    return this.authService.register(dto, query.ref, this.getRequestIp(req));
  }

  @Post('verify-otp')
  verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    return this.authService.verifyOtp(dto, this.getRequestIp(req));
  }

  @Post('resend-otp')
  resendOtp(
    @Body() dto: ResendOtpDto,
    @Req() req: Request,
  ): Promise<{ verificationId: string; message: string }> {
    return this.authService.resendOtp(dto, this.getRequestIp(req));
  }

  @Post('set-password')
  setPassword(@Body() dto: SetPasswordDto): Promise<{ message: string }> {
    return this.authService.setPassword(dto);
  }

  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ): Promise<{ accessToken: string }> {
    return this.authService.login(dto, this.getRequestIp(req));
  }

  @Post('forgot-password')
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() req: Request,
  ): Promise<{
    verificationId?: string;
    message: string;
  }> {
    return this.authService.forgotPassword(dto, this.getRequestIp(req));
  }

  @Post('verify-reset-otp')
  verifyResetOtp(@Body() dto: VerifyResetOtpDto): Promise<{
    resetToken: string;
    message: string;
  }> {
    return this.authService.verifyResetOtp(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(dto);
  }

  private getRequestIp(req: Request): string {
    return (
      req.ip ||
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }
}

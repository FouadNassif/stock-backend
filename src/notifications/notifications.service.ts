import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { buildOtpEmailTemplate } from './templates/otp.template';
import { buildNewAdminEmailTemplate } from './templates/admin.template';

@Injectable()
export class NotificationsService {
  private readonly transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('MAIL_HOST'),
      port: this.configService.getOrThrow<number>('MAIL_PORT'),
      secure: this.configService.getOrThrow<boolean>('MAIL_SECURE'),
      auth: {
        user: this.configService.getOrThrow<string>('MAIL_USER'),
        pass: this.configService.getOrThrow<string>('MAIL_PASS'),
      },
    });
  }

  async sendOtp(email: string, code: string): Promise<void> {
    const from = this.configService.getOrThrow<string>('MAIL_FROM');

    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Verify your Stock Market account',
      text: `Your OTP code is ${code}. It expires in 10 minutes.`,
      html: buildOtpEmailTemplate(code),
    });
  }

  async sendNewAdminEmail(email: string, tempPassword: string, fullName: string): Promise<void> {
    const from = this.configService.getOrThrow<string>('MAIL_FROM');

    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Welcome to Stock Market',
      text: `Dear ${fullName}, your temporary password is ${tempPassword}. Please log in and change it immediately.`,
      html: buildNewAdminEmailTemplate({ fullName, email, tempPassword }),
    });
  }

}
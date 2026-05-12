import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { buildOtpEmailTemplate, buildPasswordResetOtpEmailTemplate } from './templates/otp.template';
import { buildIdentityApprovedEmailTemplate, buildIdentityRejectedEmailTemplate, buildNewAdminEmailTemplate } from './templates/admin.template';
import { buildWalletCreditEmailTemplate, buildWithdrawalApprovedEmailTemplate, buildWithdrawalRejectedEmailTemplate } from './templates/transaction.template';
import { buildTradeConfirmationEmailTemplate } from './templates/order.template';

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


  async sendWalletCreditEmail(
    email: string,
    fullName: string,
    amount: number,
    newBalance: number,
  ): Promise<void> {
    const from = this.configService.getOrThrow<string>('MAIL_FROM');

    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Wallet Deposit Confirmation',
      text: `Dear ${fullName}, your wallet has been credited with $${amount}. Your new balance is $${newBalance}.`,
      html: buildWalletCreditEmailTemplate({ fullName, amount, newBalance }),
    });
  }

  async sendWithdrawalApprovedEmail(
    email: string,
    fullName: string,
    amount: number,
    newBalance: number,
  ): Promise<void> {
    const from = this.configService.getOrThrow<string>('MAIL_FROM');

    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Withdrawal Approved',
      text: `Dear ${fullName}, your withdrawal request of $${amount} has been approved. Your new wallet balance is $${newBalance}.`,
      html: buildWithdrawalApprovedEmailTemplate({ fullName, amount, newBalance }),
    });
  }

  async sendWithdrawalRejectedEmail(
    email: string,
    fullName: string,
    amount: number,
    reason: string,
  ): Promise<void> {
    const from = this.configService.getOrThrow<string>('MAIL_FROM');

    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Withdrawal Rejected',
      text: `Dear ${fullName}, your withdrawal request of $${amount} has been rejected. Reason: ${reason}`,
      html: buildWithdrawalRejectedEmailTemplate({ fullName, amount, reason }),
    });
  }

  async sendTradeConfirmationEmail(params: {
    email: string;
    fullName: string;
    type: 'buy' | 'sell';
    ticker: string;
    companyName: string;
    quantity: number;
    priceAtExecution: number;
    totalAmount: number;
    walletBalance: number;
    realizedProfitLoss?: number;
  }): Promise<void> {
    const from = this.configService.getOrThrow<string>('MAIL_FROM');

    await this.transporter.sendMail({
      from,
      to: params.email,
      subject:
        params.type === 'buy'
          ? 'Buy Order Confirmation'
          : 'Sell Order Confirmation',
      text:
        params.type === 'buy'
          ? `Dear ${params.fullName}, your buy order for ${params.quantity} shares of ${params.ticker} was completed successfully. Total amount: $${params.totalAmount}.`
          : `Dear ${params.fullName}, your sell order for ${params.quantity} shares of ${params.ticker} was completed successfully. Total amount: $${params.totalAmount}. Realized P&L: $${params.realizedProfitLoss ?? 0}.`,
      html: buildTradeConfirmationEmailTemplate(params),
    });
  }

  async sendPasswordResetOtpEmail(
    email: string,
    fullName: string,
    code: string,
  ): Promise<void> {
    const from = this.configService.getOrThrow<string>('MAIL_FROM');

    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Password Reset OTP',
      text: `Dear ${fullName}, your password reset code is ${code}. It expires in 10 minutes.`,
      html: buildPasswordResetOtpEmailTemplate({
        fullName,
        code,
      }),
    });
  }


  async sendIdentityApprovedEmail(
    email: string,
    fullName: string,
  ): Promise<void> {
    const from = this.configService.getOrThrow<string>('MAIL_FROM');

    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Identity Verification Approved',
      text: `Dear ${fullName}, your identity verification has been approved. You can now continue using the platform features that require verified identity.`,
      html: buildIdentityApprovedEmailTemplate({ fullName }),
    });
  }

  async sendIdentityRejectedEmail(
    email: string,
    fullName: string,
    reason: string,
  ): Promise<void> {
    const from = this.configService.getOrThrow<string>('MAIL_FROM');

    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Identity Verification Rejected',
      text: `Dear ${fullName}, your identity verification has been rejected. Reason: ${reason}`,
      html: buildIdentityRejectedEmailTemplate({ fullName, reason }),
    });
  }

}
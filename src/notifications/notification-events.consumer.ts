import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import { NotificationEventType } from '../messaging/types/notification-event.type';
import type {
    IdentityApprovedEmailRequestedPayload,
    IdentityRejectedEmailRequestedPayload,
    MemberSuspendedEmailRequestedPayload,
    NewAdminEmailRequestedPayload,
    OtpEmailRequestedPayload,
    PasswordResetOtpEmailRequestedPayload,
    PriceAlertTriggeredPayload,
    TradeConfirmationEmailRequestedPayload,
    WalletCreditEmailRequestedPayload,
    WithdrawalApprovedEmailRequestedPayload,
    WithdrawalRejectedEmailRequestedPayload,
} from '../messaging/types/notification-event.type';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationEventsConsumer {
    constructor(private readonly notificationsService: NotificationsService) { }

    @EventPattern(NotificationEventType.OtpEmailRequested)
    async handleOtpEmailRequested(
        @Payload() payload: OtpEmailRequestedPayload,
    ): Promise<void> {
        await this.notificationsService.sendOtp(payload.email, payload.code);
    }

    @EventPattern(NotificationEventType.PasswordResetOtpEmailRequested)
    async handlePasswordResetOtpEmailRequested(
        @Payload() payload: PasswordResetOtpEmailRequestedPayload,
    ): Promise<void> {
        await this.notificationsService.sendPasswordResetOtpEmail(
            payload.email,
            payload.fullName,
            payload.code,
        );
    }

    @EventPattern(NotificationEventType.NewAdminEmailRequested)
    async handleNewAdminEmailRequested(
        @Payload() payload: NewAdminEmailRequestedPayload,
    ): Promise<void> {
        await this.notificationsService.sendNewAdminEmail(
            payload.email,
            payload.tempPassword,
            payload.fullName,
        );
    }

    @EventPattern(NotificationEventType.WalletCreditEmailRequested)
    async handleWalletCreditEmailRequested(
        @Payload() payload: WalletCreditEmailRequestedPayload,
    ): Promise<void> {
        await this.notificationsService.sendWalletCreditEmail(
            payload.email,
            payload.fullName,
            payload.amount,
            payload.newBalance,
        );
    }

    @EventPattern(NotificationEventType.WithdrawalApprovedEmailRequested)
    async handleWithdrawalApprovedEmailRequested(
        @Payload() payload: WithdrawalApprovedEmailRequestedPayload,
    ): Promise<void> {
        await this.notificationsService.sendWithdrawalApprovedEmail(
            payload.email,
            payload.fullName,
            payload.amount,
            payload.newBalance,
        );
    }

    @EventPattern(NotificationEventType.WithdrawalRejectedEmailRequested)
    async handleWithdrawalRejectedEmailRequested(
        @Payload() payload: WithdrawalRejectedEmailRequestedPayload,
    ): Promise<void> {
        await this.notificationsService.sendWithdrawalRejectedEmail(
            payload.email,
            payload.fullName,
            payload.amount,
            payload.reason,
        );
    }

    @EventPattern(NotificationEventType.TradeConfirmationEmailRequested)
    async handleTradeConfirmationEmailRequested(
        @Payload() payload: TradeConfirmationEmailRequestedPayload,
    ): Promise<void> {
        await this.notificationsService.sendTradeConfirmationEmail({
            email: payload.email,
            fullName: payload.fullName,
            type: payload.type,
            ticker: payload.ticker,
            companyName: payload.companyName,
            quantity: payload.quantity,
            priceAtExecution: payload.priceAtExecution,
            totalAmount: payload.totalAmount,
            walletBalance: payload.walletBalance,
            realizedProfitLoss: payload.realizedProfitLoss,
        });
    }

    @EventPattern(NotificationEventType.IdentityApprovedEmailRequested)
    async handleIdentityApprovedEmailRequested(
        @Payload() payload: IdentityApprovedEmailRequestedPayload,
    ): Promise<void> {
        await this.notificationsService.sendIdentityApprovedEmail(
            payload.email,
            payload.fullName,
        );
    }

    @EventPattern(NotificationEventType.IdentityRejectedEmailRequested)
    async handleIdentityRejectedEmailRequested(
        @Payload() payload: IdentityRejectedEmailRequestedPayload,
    ): Promise<void> {
        await this.notificationsService.sendIdentityRejectedEmail(
            payload.email,
            payload.fullName,
            payload.reason,
        );
    }

    @EventPattern(NotificationEventType.MemberSuspendedEmailRequested)
    async handleMemberSuspendedEmailRequested(
        @Payload() payload: MemberSuspendedEmailRequestedPayload,
    ): Promise<void> {
        await this.notificationsService.sendMemberSuspendedEmail(
            payload.email,
            payload.fullName,
            payload.reason,
        );
    }

    @EventPattern(NotificationEventType.PriceAlertTriggered)
    async handlePriceAlertTriggered(
        @Payload() payload: PriceAlertTriggeredPayload,
    ): Promise<void> {
        await this.notificationsService.sendPriceAlertEmail({
            email: payload.email,
            fullName: payload.fullName,
            ticker: payload.ticker,
            companyName: payload.companyName,
            targetPrice: payload.targetPrice,
            currentPrice: payload.currentPrice,
            direction: payload.direction,
        });
    }
}
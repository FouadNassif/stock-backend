import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import Stripe from 'stripe';

import { Member, MemberDocument } from '../members/schemas/member.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { Transaction, TransactionDocument } from '../wallet/schemas/transaction.schema';
import { generateTransactionReference } from 'src/wallet/utils/transaction.utils';
import { TransactionStatus, TransactionType } from 'src/wallet/types/transaction.type';
import { MessagingService } from 'src/messaging/messaging.service';
import { NotificationEventType } from 'src/messaging/types/notification-event.type';

type StripeClient = InstanceType<typeof Stripe>;

type StripeWebhookEvent = ReturnType<StripeClient['webhooks']['constructEvent']>;

type StripeCheckoutSession = Awaited<ReturnType<StripeClient['checkout']['sessions']['retrieve']>>;

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    private readonly stripe: StripeClient;

    constructor(
        private readonly configService: ConfigService,

        @InjectConnection()
        private readonly connection: Connection,

        @InjectModel(Member.name)
        private readonly memberModel: Model<MemberDocument>,

        @InjectModel(Transaction.name)
        private readonly transactionModel: Model<TransactionDocument>,

        private readonly notificationsService: NotificationsService,
        private readonly messagingService: MessagingService,
    ) {
        this.stripe = new Stripe(this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'));
    }

    async createDepositCheckoutSession(params: {
        memberId: string;
        amount: number;
    }): Promise<{
        checkoutUrl: string;
        transactionId: string;
    }> {
        const member = await this.memberModel.findById(params.memberId).exec();

        if (!member) {
            throw new NotFoundException('Member not found');
        }

        if (!member.isActive) {
            throw new BadRequestException('Member account is inactive');
        }

        if (!member.emailVerified) {
            throw new BadRequestException('Member email is not verified');
        }

        const currency = this.configService.get<string>('STRIPE_CURRENCY') ?? 'usd';

        const transaction = await this.transactionModel.create({
            memberId: member._id,
            type: TransactionType.Deposit,
            amount: params.amount,
            status: TransactionStatus.Pending,
            referenceId: generateTransactionReference(TransactionType.Deposit),
            notes: 'Stripe deposit pending payment confirmation',
            balanceBefore: member.walletBalance,
            balanceAfter: member.walletBalance,
        });

        const checkoutSession = await this.stripe.checkout.sessions.create({
            mode: 'payment',
            customer_email: member.email,
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency,
                        unit_amount: Math.round(params.amount * 100),
                        product_data: {
                            name: 'Wallet Deposit',
                            description: `Wallet deposit for ${member.fullName}`,
                        },
                    },
                },
            ],
            success_url: this.configService.getOrThrow<string>('STRIPE_SUCCESS_URL'),
            cancel_url: this.configService.getOrThrow<string>('STRIPE_CANCEL_URL'),
            client_reference_id: transaction._id.toString(),
            metadata: {
                transactionId: transaction._id.toString(),
                memberId: member._id.toString(),
                purpose: 'wallet_deposit',
            },
            payment_intent_data: {
                metadata: {
                    transactionId: transaction._id.toString(),
                    memberId: member._id.toString(),
                    purpose: 'wallet_deposit',
                },
            },
        });

        transaction.stripeSessionId = checkoutSession.id;
        await transaction.save();

        if (!checkoutSession.url) {
            throw new BadRequestException('Unable to create Stripe checkout session');
        }

        return {
            checkoutUrl: checkoutSession.url,
            transactionId: transaction._id.toString(),
        };
    }

    constructWebhookEvent(
        rawBody: Buffer,
        signature: string,
    ): StripeWebhookEvent {
        const webhookSecret = this.configService.getOrThrow<string>(
            'STRIPE_WEBHOOK_SECRET',
        );

        return this.stripe.webhooks.constructEvent(
            rawBody,
            signature,
            webhookSecret,
        );
    }

    async handleWebhookEvent(
        event: StripeWebhookEvent,
    ): Promise<{ received: true }> {
        switch (event.type) {
            case 'checkout.session.completed': {
                const checkoutSession = event.data.object as StripeCheckoutSession;
                await this.handleCheckoutSessionCompleted(checkoutSession);
                break;
            }

            default:
                this.logger.log(`Unhandled Stripe event: ${event.type}`);
                break;
        }

        return {
            received: true,
        };
    }

    private async handleCheckoutSessionCompleted(
        checkoutSession: StripeCheckoutSession,
    ): Promise<void> {
        if (checkoutSession.payment_status !== 'paid') {
            return;
        }

        const transactionId = checkoutSession.metadata?.transactionId;

        if (!transactionId) {
            throw new BadRequestException('Missing Stripe transaction metadata');
        }

        const session = await this.connection.startSession();

        let emailPayload:
            | {
                email: string;
                fullName: string;
                amount: number;
                walletBalance: number;
            }
            | undefined;

        try {
            await session.withTransaction(async () => {
                const transaction = await this.transactionModel.findById(transactionId).session(session).exec();

                if (!transaction) {
                    throw new NotFoundException('Deposit transaction not found');
                }

                if (transaction.status === TransactionStatus.Completed) {
                    return;
                }

                if (transaction.type !== TransactionType.Deposit) {
                    throw new BadRequestException('Transaction is not a deposit');
                }

                if (transaction.status !== TransactionStatus.Pending) {
                    throw new BadRequestException('Deposit transaction is not pending');
                }

                const member = await this.memberModel.findById(transaction.memberId).session(session).exec();

                if (!member) {
                    throw new NotFoundException('Member not found');
                }

                const balanceBefore = member.walletBalance;
                const balanceAfter = balanceBefore + transaction.amount;

                member.walletBalance = balanceAfter;
                member.lastDepositAt = new Date();
                await member.save({ session });

                transaction.status = TransactionStatus.Completed;
                transaction.balanceBefore = balanceBefore;
                transaction.balanceAfter = balanceAfter;
                transaction.processedAt = new Date();
                transaction.notes = 'Stripe deposit completed successfully';

                transaction.stripePaymentIntentId = this.getPaymentIntentId(checkoutSession.payment_intent);

                await transaction.save({ session });

                emailPayload = {
                    email: member.email,
                    fullName: member.fullName,
                    amount: transaction.amount,
                    walletBalance: member.walletBalance,
                };
            });
        } finally {
            await session.endSession();
        }

        if (emailPayload) {
            await this.messagingService.publishNotification({
                type: NotificationEventType.WalletCreditEmailRequested,
                payload: {
                    email: emailPayload.email,
                    fullName: emailPayload.fullName,
                    amount: emailPayload.amount,
                    newBalance: emailPayload.walletBalance,
                },
            });
        }
    }

    private getPaymentIntentId(paymentIntent: StripeCheckoutSession['payment_intent']): string | undefined {
        if (!paymentIntent) {
            return undefined;
        }

        if (typeof paymentIntent === 'string') {
            return paymentIntent;
        }

        if (typeof paymentIntent === 'object' && 'id' in paymentIntent && typeof paymentIntent.id === 'string') {
            return paymentIntent.id;
        }

        return undefined;
    }
}
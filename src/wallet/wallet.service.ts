import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model, Types, Connection, ClientSession } from 'mongoose';

import { DepositDto } from './dto/deposit.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { ListWithdrawalsQueryDto } from './dto/list-withdrawals-query.dto';
import { RejectWithdrawalDto } from './dto/reject-withdrawal.dto';

import {
    Transaction,
    TransactionDocument,
} from './schemas/transaction.schema';
import {
    Member,
    MemberDocument,
} from '../members/schemas/member.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { checkMemberEligibility } from '../common/utils/member.util';
import { TransactionResponse, WithdrawalFilter } from './types/transaction-response.type';
import { toTransactionResponse } from './mappers/transaction.mapper';
import { generateTransactionReference } from './utils/transaction.utils';
import { TransactionStatus, TransactionType } from './types/transaction.type';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { AuditActorType, AuditLogAction, AuditTargetType } from 'src/audit-logs/types/audit-log-action.type';
import { PaymentsService } from 'src/payments/payments.service';
import { NotificationEventType } from 'src/messaging/types/notification-event.type';
import { MessagingService } from 'src/messaging/messaging.service';

type TransactionFilter = {
    memberId: Types.ObjectId;
    type?: TransactionType;
    status?: TransactionStatus;
    createdAt?: {
        $gte?: Date;
        $lte?: Date;
    };
};

@Injectable()
export class WalletService {
    private readonly withdrawalHoldHours = 48;

    constructor(
        @InjectConnection()
        private readonly connection: Connection,

        @InjectModel(Transaction.name)
        private readonly transactionModel: Model<TransactionDocument>,

        @InjectModel(Member.name)
        private readonly memberModel: Model<MemberDocument>,

        private readonly notificationsService: NotificationsService,
        private readonly auditLogsService: AuditLogsService,

        private readonly paymentsService: PaymentsService,
        private readonly messagingService: MessagingService,
    ) { }

    async deposit(
        currentMemberId: string,
        dto: DepositDto,
    ): Promise<{
        message: string;
        checkoutUrl: string;
        transactionId: string;
    }> {
        const checkoutSession =
            await this.paymentsService.createDepositCheckoutSession({
                memberId: currentMemberId,
                amount: dto.amount,
            });

        return {
            message: 'Stripe checkout session created successfully',
            checkoutUrl: checkoutSession.checkoutUrl,
            transactionId: checkoutSession.transactionId,
        };
    }

    async withdraw(
        currentMemberId: string,
        dto: WithdrawDto,
    ): Promise<{
        message: string;
        availableBalance: number;
        pendingWithdrawalAmount: number;
        transaction: TransactionResponse;
    }> {
        const member = await this.memberModel.findById(currentMemberId).exec();
        const eligibleMember = checkMemberEligibility(member, true);

        const pendingWithdrawalAmount = await this.getPendingWithdrawalAmount(eligibleMember._id);

        const availableBalance = eligibleMember.walletBalance - pendingWithdrawalAmount;

        if (availableBalance < dto.amount) {
            throw new BadRequestException(`Insufficient available balance. Current balance is ${eligibleMember.walletBalance}, pending withdrawals total is ${pendingWithdrawalAmount}, available balance is ${availableBalance}`);
        }

        if (!eligibleMember.lastDepositAt) {
            throw new BadRequestException('Withdrawal is not available because no deposit was found');
        }

        const withdrawAvailableAt = this.getWithdrawAvailableAt(eligibleMember.lastDepositAt);

        if (new Date() < withdrawAvailableAt) {
            throw new BadRequestException(`Withdrawal is allowed only after ${this.withdrawalHoldHours} hours from the most recent deposit`);
        }

        const transaction = await this.transactionModel.create({
            memberId: eligibleMember._id,
            type: TransactionType.Withdrawal,
            amount: dto.amount,
            status: TransactionStatus.Pending,
            referenceId: generateTransactionReference(TransactionType.Withdrawal),
            notes: 'Withdrawal request pending admin review',
            balanceBefore: eligibleMember.walletBalance,
            balanceAfter: eligibleMember.walletBalance,
        });

        return {
            message: 'Withdrawal request submitted for review',
            availableBalance: availableBalance - dto.amount,
            pendingWithdrawalAmount: pendingWithdrawalAmount + dto.amount,
            transaction: toTransactionResponse(transaction),
        };
    }

    async getBalance(currentMemberId: string): Promise<{
        walletBalance: number;
        lastDepositAt?: Date;
        canWithdraw: boolean;
        withdrawAvailableAt: Date | null;
    }> {
        const member = await this.memberModel.findById(currentMemberId).exec();
        const eligibleMember = checkMemberEligibility(member);

        const withdrawAvailableAt = eligibleMember.lastDepositAt
            ? this.getWithdrawAvailableAt(eligibleMember.lastDepositAt)
            : null;

        const canWithdraw = withdrawAvailableAt
            ? new Date() >= withdrawAvailableAt
            : false;

        return {
            walletBalance: eligibleMember.walletBalance,
            lastDepositAt: eligibleMember.lastDepositAt,
            canWithdraw,
            withdrawAvailableAt,
        };
    }

    async listTransactions(
        currentMemberId: string,
        query: ListTransactionsQueryDto,
    ): Promise<{
        data: TransactionResponse[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }> {
        if (!Types.ObjectId.isValid(currentMemberId)) {
            throw new UnauthorizedException('Invalid member account');
        }

        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const filter: TransactionFilter = {
            memberId: new Types.ObjectId(currentMemberId),
        };

        if (query.type) {
            filter.type = query.type;
        }

        if (query.status) {
            filter.status = query.status;
        }

        if (query.from || query.to) {
            filter.createdAt = {};

            if (query.from) {
                filter.createdAt.$gte = new Date(query.from);
            }

            if (query.to) {
                filter.createdAt.$lte = new Date(query.to);
            }
        }

        const [transactions, total] = await Promise.all([
            this.transactionModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),

            this.transactionModel.countDocuments(filter).exec(),
        ]);

        return {
            data: transactions.map((transaction) =>
                toTransactionResponse(transaction),
            ),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async listWithdrawals(query: ListWithdrawalsQueryDto): Promise<{
        data: {
            id: string;
            amount: number;
            status: TransactionStatus;
            referenceId: string;
            notes?: string;
            balanceBefore: number;
            balanceAfter: number;
            processedAt?: Date;
            rejectedReason?: string;
            createdAt?: Date;
            updatedAt?: Date;
            member: {
                id: string;
                fullName: string;
                email: string;
                walletBalance: number;
                lastDepositAt?: Date;
            };
            pendingWithdrawalAmount: number;
            availableBalance: number;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const filter: WithdrawalFilter = {
            type: TransactionType.Withdrawal,
        };

        if (query.status) {
            filter.status = query.status;
        } else {
            filter.status = TransactionStatus.Pending;
        }

        if (query.from || query.to) {
            filter.createdAt = {};

            if (query.from) {
                filter.createdAt.$gte = new Date(query.from);
            }

            if (query.to) {
                filter.createdAt.$lte = new Date(query.to);
            }
        }

        const [withdrawals, total] = await Promise.all([
            this.transactionModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('memberId')
                .exec(),

            this.transactionModel.countDocuments(filter).exec(),
        ]);

        const data = await Promise.all(
            withdrawals.map(async (withdrawal) => {
                const member = withdrawal.memberId as unknown as MemberDocument;

                const pendingWithdrawalAmount = await this.getPendingWithdrawalAmount(
                    member._id,
                );

                const availableBalance = member.walletBalance - pendingWithdrawalAmount;

                return {
                    id: withdrawal._id.toString(),
                    amount: withdrawal.amount,
                    status: withdrawal.status,
                    referenceId: withdrawal.referenceId,
                    notes: withdrawal.notes,
                    balanceBefore: withdrawal.balanceBefore,
                    balanceAfter: withdrawal.balanceAfter,
                    processedAt: withdrawal.processedAt,
                    rejectedReason: withdrawal.rejectedReason,
                    createdAt: withdrawal.createdAt,
                    updatedAt: withdrawal.updatedAt,
                    member: {
                        id: member._id.toString(),
                        fullName: member.fullName,
                        email: member.email,
                        walletBalance: member.walletBalance,
                        lastDepositAt: member.lastDepositAt,
                    },
                    pendingWithdrawalAmount,
                    availableBalance,
                };
            }),
        );

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async approveWithdrawal(
        withdrawalId: string,
        currentAdminId: string,
    ): Promise<{
        message: string;
        transaction: TransactionResponse;
        walletBalance: number;
    }> {
        const session = await this.connection.startSession();

        let response!: {
            message: string;
            transaction: TransactionResponse;
            walletBalance: number;
        };

        let emailPayload!: {
            email: string;
            fullName: string;
            amount: number;
            walletBalance: number;
        };

        try {
            await session.withTransaction(async () => {
                const withdrawal = await this.transactionModel.findById(withdrawalId).session(session).exec();

                if (!withdrawal) {
                    throw new NotFoundException('Withdrawal request not found');
                }

                if (withdrawal.type !== TransactionType.Withdrawal) {
                    throw new BadRequestException('Transaction is not a withdrawal request');
                }

                if (withdrawal.status !== TransactionStatus.Pending) {
                    throw new BadRequestException('Withdrawal request is already processed');
                }

                const member = await this.memberModel.findById(withdrawal.memberId).session(session).exec();

                const eligibleMember = checkMemberEligibility(member, true);

                const pendingWithdrawalAmount = await this.getPendingWithdrawalAmount(eligibleMember._id, session);

                const otherPendingWithdrawalAmount = pendingWithdrawalAmount - withdrawal.amount;

                const availableBalance = eligibleMember.walletBalance - otherPendingWithdrawalAmount;

                if (availableBalance < withdrawal.amount) {
                    throw new BadRequestException('Insufficient available balance');
                }

                const balanceBefore = eligibleMember.walletBalance;
                const balanceAfter = balanceBefore - withdrawal.amount;

                eligibleMember.walletBalance = balanceAfter;
                await eligibleMember.save({ session });

                withdrawal.status = TransactionStatus.Completed;
                withdrawal.balanceBefore = balanceBefore;
                withdrawal.balanceAfter = balanceAfter;
                withdrawal.processedAt = new Date();
                withdrawal.notes = `Withdrawal approved by admin ${currentAdminId}`;
                await withdrawal.save({ session });

                await this.auditLogsService.create(
                    {
                        actorId: currentAdminId,
                        actorType: AuditActorType.Admin,
                        action: AuditLogAction.WithdrawalApproved,
                        targetType: AuditTargetType.Withdrawal,
                        targetId: withdrawal._id.toString(),
                        description: 'Withdrawal request approved by admin',
                        changes: {
                            walletBalance: {
                                before: balanceBefore,
                                after: balanceAfter,
                            },
                            transactionStatus: {
                                before: TransactionStatus.Pending,
                                after: TransactionStatus.Completed,
                            },
                        },
                        metadata: {
                            memberId: eligibleMember._id.toString(),
                            memberEmail: eligibleMember.email,
                            memberFullName: eligibleMember.fullName,
                            amount: withdrawal.amount,
                            referenceId: withdrawal.referenceId,
                        },
                    },
                    session,
                );

                response = {
                    message: 'Withdrawal approved successfully',
                    transaction: toTransactionResponse(withdrawal),
                    walletBalance: eligibleMember.walletBalance,
                };

                emailPayload = {
                    email: eligibleMember.email,
                    fullName: eligibleMember.fullName,
                    amount: withdrawal.amount,
                    walletBalance: eligibleMember.walletBalance,
                };
            });
        } finally {
            await session.endSession();
        }

        await this.messagingService.publishNotification({
            type: NotificationEventType.WithdrawalApprovedEmailRequested,
            payload: {
                email: emailPayload.email,
                fullName: emailPayload.fullName,
                amount: emailPayload.amount,
                newBalance: emailPayload.walletBalance,
            },
        });

        return response;
    }

    async rejectWithdrawal(
        withdrawalId: string,
        currentAdminId: string,
        dto: RejectWithdrawalDto,
    ): Promise<{
        message: string;
        transaction: TransactionResponse;
    }> {
        if (!Types.ObjectId.isValid(withdrawalId)) {
            throw new NotFoundException('Withdrawal request not found');
        }

        const withdrawal = await this.transactionModel.findById(withdrawalId).exec();

        if (!withdrawal) {
            throw new NotFoundException('Withdrawal request not found');
        }

        if (withdrawal.type !== TransactionType.Withdrawal) {
            throw new BadRequestException('Transaction is not a withdrawal request');
        }

        if (withdrawal.status !== TransactionStatus.Pending) {
            throw new BadRequestException('Withdrawal request is already processed');
        }

        const member = await this.memberModel.findById(withdrawal.memberId).exec();
        const eligibleMember = checkMemberEligibility(member, true);

        withdrawal.status = TransactionStatus.Rejected;
        withdrawal.rejectedReason = dto.reason;
        withdrawal.processedAt = new Date();
        withdrawal.notes = `Withdrawal rejected by admin ${currentAdminId}`;
        withdrawal.balanceAfter = eligibleMember.walletBalance;

        await withdrawal.save();

        await this.messagingService.publishNotification({
            type: NotificationEventType.WithdrawalRejectedEmailRequested,
            payload: {
                email: eligibleMember.email,
                fullName: eligibleMember.fullName,
                amount: withdrawal.amount,
                reason: dto.reason,
            },
        });

        await this.auditLogsService.create({
            actorId: currentAdminId,
            actorType: AuditActorType.Admin,
            action: AuditLogAction.WithdrawalRejected,
            targetType: AuditTargetType.Withdrawal,
            targetId: withdrawal._id.toString(),
            description: 'Withdrawal request rejected by admin',
            reason: dto.reason,
            changes: {
                transactionStatus: {
                    before: TransactionStatus.Pending,
                    after: TransactionStatus.Rejected,
                },
            },
            metadata: {
                memberId: eligibleMember._id.toString(),
                memberEmail: eligibleMember.email,
                memberFullName: eligibleMember.fullName,
                amount: withdrawal.amount,
                referenceId: withdrawal.referenceId,
            },
        });

        return {
            message: 'Withdrawal rejected successfully',
            transaction: toTransactionResponse(withdrawal),
        };
    }

    private getWithdrawAvailableAt(lastDepositAt: Date): Date {
        return new Date(
            lastDepositAt.getTime() + this.withdrawalHoldHours * 60 * 60 * 1000,
        );
    }


    private async getPendingWithdrawalAmount(
        memberId: Types.ObjectId,
        session?: ClientSession,
    ): Promise<number> {
        const result = await this.transactionModel.aggregate<{
            totalPendingAmount: number;
        }>([
            {
                $match: {
                    memberId,
                    type: TransactionType.Withdrawal,
                    status: TransactionStatus.Pending,
                },
            },
            {
                $group: {
                    _id: null,
                    totalPendingAmount: {
                        $sum: '$amount',
                    },
                },
            },
        ]).session(session ?? null);

        return result[0]?.totalPendingAmount ?? 0;
    }
}
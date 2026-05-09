import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model, Types } from 'mongoose';

import { DepositDto } from './dto/deposit.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import {
    Transaction,
    TransactionDocument,
    TransactionStatus,
    TransactionType,
} from './schemas/transaction.schema';
import {
    Member,
    MemberDocument,
} from '../members/schemas/member.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { checkMemberEligibility } from '../common/utils/member.util';

type TransactionFilter = {
    memberId: Types.ObjectId;
    type?: TransactionType;
    status?: TransactionStatus;
    createdAt?: {
        $gte?: Date;
        $lte?: Date;
    };
};

type TransactionResponse = {
    id: string;
    type: TransactionType;
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
};

@Injectable()
export class WalletService {
    private readonly withdrawalHoldHours = 48;

    constructor(
        @InjectModel(Transaction.name)
        private readonly transactionModel: Model<TransactionDocument>,

        @InjectModel(Member.name)
        private readonly memberModel: Model<MemberDocument>,

        private readonly notificationsService: NotificationsService,
    ) { }

    async deposit(
        currentMemberId: string,
        dto: DepositDto,
    ): Promise<{
        message: string;
        walletBalance: number;
        transaction: TransactionResponse;
    }> {
        const member = await this.memberModel.findById(currentMemberId).exec();
        const eligibleMember = checkMemberEligibility(member);

        const balanceBefore = eligibleMember.walletBalance;
        const balanceAfter = balanceBefore + dto.amount;

        const transaction = await this.transactionModel.create({
            memberId: eligibleMember._id,
            type: TransactionType.Deposit,
            amount: dto.amount,
            status: TransactionStatus.Pending,
            referenceId: this.generateTransactionReference(TransactionType.Deposit),
            notes: 'Deposit simulated as successful payment',
            balanceBefore,
            balanceAfter,
        });

        eligibleMember.walletBalance = balanceAfter;
        eligibleMember.lastDepositAt = new Date();
        await eligibleMember.save();

        transaction.status = TransactionStatus.Completed;
        transaction.processedAt = new Date();
        await transaction.save();

        await this.notificationsService.sendWalletCreditEmail(
            eligibleMember.email,
            eligibleMember.fullName,
            dto.amount,
            eligibleMember.walletBalance,
        );

        return {
            message: 'Deposit completed successfully',
            walletBalance: eligibleMember.walletBalance,
            transaction: this.toTransactionResponse(transaction),
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
        const eligibleMember = checkMemberEligibility(member);

        const pendingWithdrawalAmount = await this.getPendingWithdrawalAmount(eligibleMember._id);

        const availableBalance = eligibleMember.walletBalance - pendingWithdrawalAmount;

        if (availableBalance < dto.amount) {
            throw new BadRequestException(`Insufficient available balance. Current balance is ${eligibleMember.walletBalance}, pending withdrawals total is ${pendingWithdrawalAmount}, available balance is ${availableBalance}`);
        }

        if (!eligibleMember.lastDepositAt) {
            throw new BadRequestException('Withdrawal is not available because no deposit was found');
        }

        const withdrawAvailableAt = this.getWithdrawAvailableAt(
            eligibleMember.lastDepositAt,
        );

        if (new Date() < withdrawAvailableAt) {
            throw new BadRequestException(`Withdrawal is allowed only after ${this.withdrawalHoldHours} hours from the most recent deposit`);
        }

        const transaction = await this.transactionModel.create({
            memberId: eligibleMember._id,
            type: TransactionType.Withdrawal,
            amount: dto.amount,
            status: TransactionStatus.Pending,
            referenceId: this.generateTransactionReference(TransactionType.Withdrawal),
            notes: 'Withdrawal request pending admin review',
            balanceBefore: eligibleMember.walletBalance,
            balanceAfter: eligibleMember.walletBalance,
        });

        return {
            message: 'Withdrawal request submitted for review',
            availableBalance: availableBalance - dto.amount,
            pendingWithdrawalAmount: pendingWithdrawalAmount + dto.amount,
            transaction: this.toTransactionResponse(transaction),
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
                this.toTransactionResponse(transaction),
            ),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    private getWithdrawAvailableAt(lastDepositAt: Date): Date {
        return new Date(
            lastDepositAt.getTime() + this.withdrawalHoldHours * 60 * 60 * 1000,
        );
    }

    private generateTransactionReference(type: TransactionType): string {
        return `${type.toUpperCase()}-${randomUUID()}`;
    }

    private async getPendingWithdrawalAmount(
        memberId: Types.ObjectId,
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
        ]);

        return result[0]?.totalPendingAmount ?? 0;
    }

    private toTransactionResponse(
        transaction: TransactionDocument,
    ): TransactionResponse {
        return {
            id: transaction._id.toString(),
            type: transaction.type,
            amount: transaction.amount,
            status: transaction.status,
            referenceId: transaction.referenceId,
            notes: transaction.notes,
            balanceBefore: transaction.balanceBefore,
            balanceAfter: transaction.balanceAfter,
            processedAt: transaction.processedAt,
            rejectedReason: transaction.rejectedReason,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
        };
    }
}
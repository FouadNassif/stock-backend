import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Member, MemberDocument } from '../members/schemas/member.schema';
import {
    Transaction,
    TransactionDocument,
} from '../wallet/schemas/transaction.schema';
import {
    TransactionStatus,
    TransactionType,
} from '../wallet/types/transaction.type';
import { toNegativeBalanceAlertResponse } from './mappers/negative-balance-alert.mapper';
import { toStalePendingWithdrawalAlertResponse } from './mappers/stale-pending-withdrawal-alert.mapper';
import {
    NegativeBalanceAlert,
    NegativeBalanceAlertDocument,
} from './schemas/negative-balance-alert.schema';
import {
    StalePendingWithdrawalAlert,
    StalePendingWithdrawalAlertDocument,
} from './schemas/stale-pending-withdrawal-alert.schema';
import { NegativeBalanceAlertResponse } from './types/negative-balance-alert-response.type';
import { StalePendingWithdrawalAlertResponse } from './types/stale-pending-withdrawal-alert-response.type';

const STALE_PENDING_WITHDRAWAL_HOURS = 24;

type PopulatedMember = {
    _id: Types.ObjectId;
    fullName: string;
    email: string;
};

@Injectable()
export class SystemAlertsService {
    constructor(
        @InjectModel(Member.name)
        private readonly memberModel: Model<MemberDocument>,

        @InjectModel(Transaction.name)
        private readonly transactionModel: Model<TransactionDocument>,

        @InjectModel(NegativeBalanceAlert.name)
        private readonly negativeBalanceAlertModel: Model<NegativeBalanceAlertDocument>,

        @InjectModel(StalePendingWithdrawalAlert.name)
        private readonly stalePendingWithdrawalAlertModel: Model<StalePendingWithdrawalAlertDocument>,
    ) { }

    async runNegativeBalanceCheckFromScheduler(): Promise<void> {
        await this.createNegativeBalanceSnapshot();
    }

    async runStalePendingWithdrawalsCheckFromScheduler(): Promise<void> {
        await this.createStalePendingWithdrawalSnapshot();
    }

    async runNegativeBalanceCheckManually(): Promise<{
        message: string;
        alert: NegativeBalanceAlertResponse;
    }> {
        const alert = await this.createNegativeBalanceSnapshot();

        return {
            message: 'Negative balance check completed successfully',
            alert: toNegativeBalanceAlertResponse(alert),
        };
    }

    async runStalePendingWithdrawalsCheckManually(): Promise<{
        message: string;
        alert: StalePendingWithdrawalAlertResponse;
    }> {
        const alert = await this.createStalePendingWithdrawalSnapshot();

        return {
            message: 'Stale pending withdrawals check completed successfully',
            alert: toStalePendingWithdrawalAlertResponse(alert),
        };
    }

    async getLatestNegativeBalanceAlert(): Promise<NegativeBalanceAlertResponse> {
        const alert = await this.negativeBalanceAlertModel
            .findOne()
            .sort({ checkedAt: -1 })
            .exec();

        if (!alert) {
            throw new NotFoundException('No negative balance alert snapshot found');
        }

        return toNegativeBalanceAlertResponse(alert);
    }

    async getLatestStalePendingWithdrawalsAlert(): Promise<StalePendingWithdrawalAlertResponse> {
        const alert = await this.stalePendingWithdrawalAlertModel
            .findOne()
            .sort({ checkedAt: -1 })
            .exec();

        if (!alert) {
            throw new NotFoundException(
                'No stale pending withdrawals alert snapshot found',
            );
        }

        return toStalePendingWithdrawalAlertResponse(alert);
    }

    private async createNegativeBalanceSnapshot(): Promise<NegativeBalanceAlertDocument> {
        const members = await this.memberModel
            .find({
                walletBalance: { $lt: 0 },
            })
            .select('fullName email walletBalance')
            .sort({ walletBalance: 1 })
            .exec();

        const snapshotMembers = members.map((member) => ({
            memberId: member._id,
            fullName: member.fullName,
            email: member.email,
            walletBalance: member.walletBalance,
        }));

        return this.negativeBalanceAlertModel.create({
            members: snapshotMembers,
            totalCount: snapshotMembers.length,
            checkedAt: new Date(),
        });
    }

    private async createStalePendingWithdrawalSnapshot(): Promise<StalePendingWithdrawalAlertDocument> {
        const thresholdDate = new Date(
            Date.now() - STALE_PENDING_WITHDRAWAL_HOURS * 60 * 60 * 1000,
        );

        const staleWithdrawals = await this.transactionModel
            .find({
                type: TransactionType.Withdrawal,
                status: TransactionStatus.Pending,
                createdAt: {
                    $lte: thresholdDate,
                },
            })
            .populate<{ memberId: PopulatedMember }>('memberId')
            .sort({ createdAt: 1 })
            .exec();

        const snapshotWithdrawals = staleWithdrawals.map((withdrawal) => {
            const member = withdrawal.memberId;

            const ageHours = Math.floor(
                (Date.now() - withdrawal.createdAt.getTime()) / (60 * 60 * 1000),
            );

            return {
                transactionId: withdrawal._id,
                memberId: member._id,
                memberFullName: member.fullName,
                memberEmail: member.email,
                amount: withdrawal.amount,
                status: withdrawal.status,
                requestedAt: withdrawal.createdAt,
                ageHours,
            };
        });

        return this.stalePendingWithdrawalAlertModel.create({
            withdrawals: snapshotWithdrawals,
            totalCount: snapshotWithdrawals.length,
            thresholdHours: STALE_PENDING_WITHDRAWAL_HOURS,
            checkedAt: new Date(),
        });
    }
}
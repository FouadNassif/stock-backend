import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Member, MemberDocument } from '../members/schemas/member.schema';
import { toNegativeBalanceAlertResponse } from './mappers/negative-balance-alert.mapper';
import { NegativeBalanceAlert, NegativeBalanceAlertDocument } from './schemas/negative-balance-alert.schema';
import { NegativeBalanceAlertResponse } from './types/negative-balance-alert-response.type';

@Injectable()
export class SystemAlertsService {
    constructor(
        @InjectModel(Member.name)
        private readonly memberModel: Model<MemberDocument>,

        @InjectModel(NegativeBalanceAlert.name)
        private readonly negativeBalanceAlertModel: Model<NegativeBalanceAlertDocument>,
    ) { }

    async runNegativeBalanceCheckFromScheduler(): Promise<void> {
        await this.createNegativeBalanceSnapshot();
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
}
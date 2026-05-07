import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
    Referral,
    ReferralDocument,
    ReferralStatus,
} from './schemas/referral.schema';
import { Member, MemberDocument } from '../members/schemas/member.schema';

@Injectable()
export class ReferralsService {
    constructor(
        @InjectModel(Referral.name)
        private readonly referralModel: Model<ReferralDocument>,

        @InjectModel(Member.name)
        private readonly memberModel: Model<MemberDocument>,
    ) { }

    async createReferralIfCodeProvided(params: {
        referralCode?: string;
        referredMemberId: Types.ObjectId;
    }): Promise<void> {
        if (!params.referralCode) {
            return;
        }

        const referrer = await this.memberModel
            .findOne({ referralCode: params.referralCode.toUpperCase() })
            .exec();

        if (!referrer) {
            throw new BadRequestException('Invalid referral code');
        }

        if (referrer._id.equals(params.referredMemberId)) {
            throw new BadRequestException('Member cannot refer themselves');
        }

        await this.referralModel.create({
            referrerId: referrer._id,
            referredMemberId: params.referredMemberId,
            referralCode: params.referralCode.toUpperCase(),
            status: ReferralStatus.Registered,
            registeredAt: new Date(),
        });
    }

    async markEmailVerified(referredMemberId: Types.ObjectId): Promise<void> {
        await this.referralModel
            .updateOne(
                {
                    referredMemberId,
                    status: ReferralStatus.Registered,
                },
                {
                    $set: {
                        status: ReferralStatus.EmailVerified,
                        emailVerifiedAt: new Date(),
                    },
                },
            )
            .exec();
    }
}
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Referral, ReferralSchema } from './schemas/referral.schema';
import { ReferralsService } from './referrals.service';
import { Member, MemberSchema } from '../members/schemas/member.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Referral.name,
        schema: ReferralSchema,
      },
      {
        name: Member.name,
        schema: MemberSchema,
      },
    ]),
  ],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule { }
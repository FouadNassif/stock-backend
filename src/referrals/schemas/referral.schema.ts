import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReferralDocument = HydratedDocument<Referral>;

export enum ReferralStatus {
  Registered = 'registered',
  EmailVerified = 'email_verified',
  Rewarded = 'rewarded',
  Cancelled = 'cancelled',
}

@Schema({ timestamps: true })
export class Referral {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member' })
  referrerId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', unique: true })
  referredMemberId!: Types.ObjectId;

  @Prop({ required: true, uppercase: true, trim: true })
  referralCode!: string;

  @Prop({
    required: true,
    enum: ReferralStatus,
    default: ReferralStatus.Registered,
  })
  status!: ReferralStatus;

  @Prop()
  registeredAt?: Date;

  @Prop()
  emailVerifiedAt?: Date;
}

export const ReferralSchema = SchemaFactory.createForClass(Referral);

ReferralSchema.index({ referrerId: 1, createdAt: -1 });
ReferralSchema.index({ referralCode: 1 });
ReferralSchema.index({ status: 1 });

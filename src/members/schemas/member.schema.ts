import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument, Types } from 'mongoose';

export type MemberDocument = HydratedDocument<Member> & {
    _id: Types.ObjectId;
};

export enum IdentityStatus {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected',
}

@Schema({ timestamps: true })
export class Member {
    @Prop({ required: true, trim: true })
    fullName!: string;

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    email!: string;

    @Prop({ required: true, unique: true, trim: true })
    nationalId!: string;

    @Prop({ required: true })
    dateOfBirth!: Date;

    @Prop()
    password?: string;

    @Prop({ default: false })
    emailVerified!: boolean;

    @Prop({ required: true, unique: true, uppercase: true, trim: true })
    referralCode!: string;


    @Prop({ enum: IdentityStatus, default: IdentityStatus.Pending, })
    identityStatus!: IdentityStatus;

    @Prop({ default: true })
    isActive!: boolean;

    @Prop({ default: 0, min: 0 })
    walletBalance!: number;

    @Prop()
    lastDepositAt?: Date;
}

export const MemberSchema = SchemaFactory.createForClass(Member);

MemberSchema.index({ emailVerified: 1 });
MemberSchema.index({ isActive: 1 });
MemberSchema.index({ identityStatus: 1 });
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OtpDocument = HydratedDocument<Otp> & {
    _id: Types.ObjectId;
};

export enum OtpPurpose {
    EmailVerification = 'email_verification',
    PasswordReset = 'password_reset',
}

@Schema({ timestamps: true })
export class Otp {
    @Prop({ required: true, type: Types.ObjectId, ref: 'Member' })
    memberId!: Types.ObjectId;

    @Prop({ required: true, unique: true })
    verificationId!: string;

    @Prop({ required: true })
    codeHash!: string;

    @Prop({ required: true, enum: OtpPurpose })
    purpose!: OtpPurpose;

    @Prop({ required: true })
    expiresAt!: Date;

    @Prop({ default: false })
    used!: boolean;

    @Prop()
    usedAt?: Date;

    @Prop({ default: 0 })
    attempts!: number;

    @Prop({ default: 5 })
    maxAttempts!: number;

    @Prop()
    ipAddress?: string;

    @Prop()
    userAgent?: string;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

OtpSchema.index({ memberId: 1, purpose: 1, used: 1 });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
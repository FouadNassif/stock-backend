import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StalePendingWithdrawalAlertDocument =
    HydratedDocument<StalePendingWithdrawalAlert> & {
        _id: Types.ObjectId;
        createdAt: Date;
        updatedAt: Date;
    };

export type StalePendingWithdrawalSnapshot = {
    transactionId: Types.ObjectId;
    memberId: Types.ObjectId;
    memberFullName: string;
    memberEmail: string;
    amount: number;
    status: string;
    requestedAt: Date;
    ageHours: number;
};

@Schema({ timestamps: true })
export class StalePendingWithdrawalAlert {
    @Prop({
        type: [
            {
                transactionId: {
                    type: Types.ObjectId,
                    ref: 'Transaction',
                    required: true,
                },
                memberId: {
                    type: Types.ObjectId,
                    ref: 'Member',
                    required: true,
                },
                memberFullName: {
                    type: String,
                    required: true,
                    trim: true,
                },
                memberEmail: {
                    type: String,
                    required: true,
                    lowercase: true,
                    trim: true,
                },
                amount: {
                    type: Number,
                    required: true,
                    min: 0,
                },
                status: {
                    type: String,
                    required: true,
                },
                requestedAt: {
                    type: Date,
                    required: true,
                },
                ageHours: {
                    type: Number,
                    required: true,
                    min: 0,
                },
            },
        ],
        default: [],
    })
    withdrawals!: StalePendingWithdrawalSnapshot[];

    @Prop({ required: true, default: 0 })
    totalCount!: number;

    @Prop({ required: true, default: 24 })
    thresholdHours!: number;

    @Prop({ required: true })
    checkedAt!: Date;
}

export const StalePendingWithdrawalAlertSchema =
    SchemaFactory.createForClass(StalePendingWithdrawalAlert);

StalePendingWithdrawalAlertSchema.index({ checkedAt: -1 });
StalePendingWithdrawalAlertSchema.index({ createdAt: -1 });
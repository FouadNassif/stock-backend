import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NegativeBalanceAlertDocument =
    HydratedDocument<NegativeBalanceAlert> & {
        _id: Types.ObjectId;
        createdAt: Date;
        updatedAt: Date;
    };

export type NegativeBalanceMemberSnapshot = {
    memberId: Types.ObjectId;
    fullName: string;
    email: string;
    walletBalance: number;
};

@Schema({ timestamps: true })
export class NegativeBalanceAlert {
    @Prop({
        type: [
            {
                memberId: { type: Types.ObjectId, ref: 'Member', required: true },
                fullName: { type: String, required: true },
                email: { type: String, required: true },
                walletBalance: { type: Number, required: true },
            },
        ],
        default: [],
    })
    members!: NegativeBalanceMemberSnapshot[];

    @Prop({ required: true, default: 0 })
    totalCount!: number;

    @Prop({ required: true })
    checkedAt!: Date;
}

export const NegativeBalanceAlertSchema =
    SchemaFactory.createForClass(NegativeBalanceAlert);

NegativeBalanceAlertSchema.index({ checkedAt: -1 });
NegativeBalanceAlertSchema.index({ createdAt: -1 });
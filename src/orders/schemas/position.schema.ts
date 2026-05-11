import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PositionDocument = HydratedDocument<Position> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};

export enum PositionStatus {
    Open = 'open',
    Closed = 'closed',
}

@Schema({ timestamps: true })
export class Position {
    @Prop({ required: true, type: Types.ObjectId, ref: 'Member' })
    memberId!: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'Stock' })
    stockId!: Types.ObjectId;

    @Prop({ required: true, min: 0 })
    sharesHeld!: number;

    @Prop({ required: true, min: 0 })
    avgPurchasePrice!: number;

    @Prop({
        required: true,
        enum: PositionStatus,
        default: PositionStatus.Open,
    })
    status!: PositionStatus;

    @Prop({ required: true, default: Date.now })
    openedAt!: Date;

    @Prop()
    closedAt?: Date;
}

export const PositionSchema = SchemaFactory.createForClass(Position);

PositionSchema.index({ memberId: 1, status: 1 });
PositionSchema.index({ memberId: 1, stockId: 1, status: 1 });
PositionSchema.index({ stockId: 1 });
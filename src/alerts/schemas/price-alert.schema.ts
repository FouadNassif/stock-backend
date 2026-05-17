import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PriceAlertDocument = HydratedDocument<PriceAlert> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export enum PriceAlertDirection {
  Above = 'above',
  Below = 'below',
}

@Schema({ timestamps: true })
export class PriceAlert {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member' })
  memberId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Stock' })
  stockId!: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  targetPrice!: number;

  @Prop({ required: true, enum: PriceAlertDirection })
  direction!: PriceAlertDirection;

  @Prop({ default: false })
  triggered!: boolean;

  @Prop()
  triggeredAt?: Date;
}

export const PriceAlertSchema = SchemaFactory.createForClass(PriceAlert);

PriceAlertSchema.index({ memberId: 1, triggered: 1 });
PriceAlertSchema.index({ stockId: 1, triggered: 1 });
PriceAlertSchema.index({ stockId: 1, direction: 1, triggered: 1 });
PriceAlertSchema.index({
  memberId: 1,
  stockId: 1,
  direction: 1,
  targetPrice: 1,
  triggered: 1,
});

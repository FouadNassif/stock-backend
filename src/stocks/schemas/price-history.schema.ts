import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PriceHistoryDocument = HydratedDocument<PriceHistory> & {
  _id: Types.ObjectId;
};

@Schema({ timestamps: true })
export class PriceHistory {
  @Prop({ type: Types.ObjectId, ref: 'Stock', required: true })
  stockId!: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: true, default: Date.now })
  recordedAt!: Date;
}

export const PriceHistorySchema = SchemaFactory.createForClass(PriceHistory);

PriceHistorySchema.index({ stockId: 1, recordedAt: -1 });

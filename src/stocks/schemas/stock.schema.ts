import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StockDocument = HydratedDocument<Stock> & {
  _id: Types.ObjectId;
};

@Schema({ timestamps: true })
export class Stock {
  @Prop({ required: true, trim: true, unique: true, uppercase: true })
  ticker!: string;

  @Prop({ required: true, trim: true })
  companyName!: string;

  @Prop({ required: true, trim: true })
  sector!: string;

  @Prop()
  description?: string;

  @Prop({ required: true, min: 0 })
  currentPrice!: number;

  @Prop({ default: true })
  isListed!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const StockSchema = SchemaFactory.createForClass(Stock);

StockSchema.index({ sector: 1 });
StockSchema.index({ isListed: 1 });
StockSchema.index({ companyName: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export enum OrderType {
  Buy = 'buy',
  Sell = 'sell',
}

export enum OrderStatus {
  Completed = 'completed',
  Rejected = 'rejected',
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member' })
  memberId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Stock' })
  stockId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Position' })
  positionId!: Types.ObjectId;

  @Prop({ required: true, enum: OrderType })
  type!: OrderType;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  priceAtExecution!: number;

  @Prop({ required: true, min: 0 })
  totalAmount!: number;

  @Prop({
    required: true,
    enum: OrderStatus,
    default: OrderStatus.Completed,
  })
  status!: OrderStatus;

  @Prop({ default: 0 })
  realizedProfitLoss!: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ memberId: 1, createdAt: -1 });
OrderSchema.index({ memberId: 1, type: 1 });
OrderSchema.index({ stockId: 1 });
OrderSchema.index({ status: 1 });

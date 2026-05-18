import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TransactionStatus, TransactionType } from '../types/transaction.type';

export type TransactionDocument = HydratedDocument<Transaction> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member' })
  memberId!: Types.ObjectId;

  @Prop({ required: true, enum: TransactionType })
  type!: TransactionType;

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({
    required: true,
    enum: TransactionStatus,
    default: TransactionStatus.Pending,
  })
  status!: TransactionStatus;

  @Prop({ required: true, trim: true })
  referenceId!: string;

  @Prop()
  notes?: string;

  @Prop({ required: true, min: 0 })
  balanceBefore!: number;

  @Prop({ required: true, min: 0 })
  balanceAfter!: number;

  @Prop()
  stripeSessionId?: string;

  @Prop()
  stripePaymentIntentId?: string;

  @Prop()
  rejectedReason?: string;

  @Prop()
  processedAt?: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.index({ memberId: 1, createdAt: -1 });
TransactionSchema.index({ memberId: 1, type: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ referenceId: 1 }, { unique: true });
TransactionSchema.index({ stripeSessionId: 1 });
TransactionSchema.index({ stripePaymentIntentId: 1 });

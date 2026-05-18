import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AdminDocument = HydratedDocument<Admin> & {
  _id: Types.ObjectId;
};

export enum AdminRole {
  Admin = 'admin',
  Analyst = 'analyst',
  Support = 'support',
}

@Schema({ timestamps: true })
export class Admin {
  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true, enum: AdminRole })
  role!: AdminRole;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  mustChangePassword!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Admin' })
  createdBy?: Types.ObjectId;

  @Prop()
  lastLoginAt?: Date;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);

AdminSchema.index({ role: 1 });
AdminSchema.index({ isActive: 1 });
AdminSchema.index({ createdAt: -1 });

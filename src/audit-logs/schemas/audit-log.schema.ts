import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

import {
    AuditActorType,
    AuditLogAction,
    AuditTargetType,
} from '../types/audit-log-action.type';

export type AuditLogDocument = HydratedDocument<AuditLog> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};

@Schema({ timestamps: true })
export class AuditLog {
    @Prop({ type: Types.ObjectId })
    actorId?: Types.ObjectId;

    @Prop({ required: true, enum: AuditActorType })
    actorType!: AuditActorType;

    @Prop({ required: true, enum: AuditLogAction })
    action!: AuditLogAction;

    @Prop({ required: true, enum: AuditTargetType })
    targetType!: AuditTargetType;

    @Prop({ type: Types.ObjectId })
    targetId?: Types.ObjectId;

    @Prop({ required: true })
    description!: string;

    @Prop()
    reason?: string;

    @Prop({ type: MongooseSchema.Types.Mixed })
    changes?: Record<
        string,
        {
            before?: unknown;
            after?: unknown;
        }
    >;

    @Prop({ type: MongooseSchema.Types.Mixed })
    metadata?: Record<string, unknown>;

    @Prop()
    ipAddress?: string;

    @Prop()
    userAgent?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ targetId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ targetType: 1, createdAt: -1 });
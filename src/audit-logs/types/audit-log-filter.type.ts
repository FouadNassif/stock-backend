import { Types } from 'mongoose';

import {
    AuditActorType,
    AuditLogAction,
    AuditTargetType,
} from './audit-log-action.type';

export type AuditLogFilter = {
    actorType?: AuditActorType;
    actorId?: Types.ObjectId;
    action?: AuditLogAction;
    targetType?: AuditTargetType;
    targetId?: Types.ObjectId;
    createdAt?: {
        $gte?: Date;
        $lte?: Date;
    };
    $or?: {
        description?: RegExp;
        reason?: RegExp;
    }[];
};
import {
    AuditActorType,
    AuditLogAction,
    AuditTargetType,
} from './audit-log-action.type';

export type AuditLogChangeValue = {
    before?: unknown;
    after?: unknown;
};

export type CreateAuditLogParams = {
    actorId?: string;
    actorType: AuditActorType;

    action: AuditLogAction;

    targetType: AuditTargetType;
    targetId?: string;

    description: string;
    reason?: string;

    changes?: Record<string, AuditLogChangeValue>;
    metadata?: Record<string, unknown>;

    ipAddress?: string;
    userAgent?: string;
};
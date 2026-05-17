import {
  AuditActorType,
  AuditLogAction,
  AuditTargetType,
} from './audit-log-action.type';

export type AuditLogResponse = {
  id: string;
  actorId?: string;
  actorType: AuditActorType;
  action: AuditLogAction;
  targetType: AuditTargetType;
  targetId?: string;
  description: string;
  reason?: string;
  changes?: Record<
    string,
    {
      before?: unknown;
      after?: unknown;
    }
  >;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

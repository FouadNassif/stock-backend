import { AuditLogDocument } from '../schemas/audit-log.schema';
import { AuditLogResponse } from '../types/audit-log-response.type';

export function toAuditLogResponse(
    auditLog: AuditLogDocument,
): AuditLogResponse {
    return {
        id: auditLog._id.toString(),
        actorId: auditLog.actorId?.toString(),
        actorType: auditLog.actorType,
        action: auditLog.action,
        targetType: auditLog.targetType,
        targetId: auditLog.targetId?.toString(),
        description: auditLog.description,
        reason: auditLog.reason,
        changes: auditLog.changes,
        metadata: auditLog.metadata,
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent,
        createdAt: auditLog.createdAt,
        updatedAt: auditLog.updatedAt,
    };
}
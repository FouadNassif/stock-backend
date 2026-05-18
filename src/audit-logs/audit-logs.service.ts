import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';

import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { CreateAuditLogParams } from './types/create-audit-log.type';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';
import { AuditLogResponse } from './types/audit-log-response.type';
import { AuditLogFilter } from './types/audit-log-filter.type';
import { toAuditLogResponse } from './mappers/audit-log.mapper';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(
    params: CreateAuditLogParams,
    session?: ClientSession,
  ): Promise<void> {
    const auditLog = {
      actorId: this.toObjectIdOrUndefined(params.actorId),
      actorType: params.actorType,
      action: params.action,
      targetType: params.targetType,
      targetId: this.toObjectIdOrUndefined(params.targetId),
      description: params.description,
      reason: params.reason,
      changes: params.changes,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    };

    await this.auditLogModel.create([auditLog], { session });
  }

  async list(query: ListAuditLogsQueryDto): Promise<{
    data: AuditLogResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const filter: AuditLogFilter = {};

    if (query.actorType) {
      filter.actorType = query.actorType;
    }

    if (query.actorId) {
      if (!Types.ObjectId.isValid(query.actorId)) {
        throw new BadRequestException('Invalid actorId');
      }

      filter.actorId = new Types.ObjectId(query.actorId);
    }

    if (query.action) {
      filter.action = query.action;
    }

    if (query.targetType) {
      filter.targetType = query.targetType;
    }

    if (query.targetId) {
      if (!Types.ObjectId.isValid(query.targetId)) {
        throw new BadRequestException('Invalid targetId');
      }

      filter.targetId = new Types.ObjectId(query.targetId);
    }

    if (query.from || query.to) {
      filter.createdAt = {};

      if (query.from) {
        filter.createdAt.$gte = new Date(query.from);
      }

      if (query.to) {
        filter.createdAt.$lte = new Date(query.to);
      }
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');

      filter.$or = [{ description: searchRegex }, { reason: searchRegex }];
    }

    const [auditLogs, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),

      this.auditLogModel.countDocuments(filter).exec(),
    ]);

    return {
      data: auditLogs.map((auditLog) => toAuditLogResponse(auditLog)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private toObjectIdOrUndefined(value?: string): Types.ObjectId | undefined {
    if (!value || !Types.ObjectId.isValid(value)) {
      return undefined;
    }

    return new Types.ObjectId(value);
  }
}

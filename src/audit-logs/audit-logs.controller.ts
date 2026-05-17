import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminJwtAuthGuard } from '../admin/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRole } from '../admin/schemas/admin.schema';
import { AuditLogsService } from './audit-logs.service';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

@Controller('admin/audit-logs')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.Admin)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  list(@Query() query: ListAuditLogsQueryDto) {
    return this.auditLogsService.list(query);
  }
}

import { Controller, Get, Post, UseGuards } from '@nestjs/common';

import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminJwtAuthGuard } from '../admin/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRole } from '../admin/schemas/admin.schema';
import { SystemAlertsService } from './system-alerts.service';

@Controller('admin/alerts')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
export class SystemAlertsController {
    constructor(private readonly systemAlertsService: SystemAlertsService) { }

    @Get('negative-balances')
    @AdminRoles(AdminRole.Admin)
    getLatestNegativeBalanceAlert() {
        return this.systemAlertsService.getLatestNegativeBalanceAlert();
    }

    @Post('negative-balances/run')
    @AdminRoles(AdminRole.Admin)
    runNegativeBalanceCheckManually() {
        return this.systemAlertsService.runNegativeBalanceCheckManually();
    }

    @Get('stale-pending-withdrawals')
    @AdminRoles(AdminRole.Support)
    getLatestStalePendingWithdrawalsAlert() {
        return this.systemAlertsService.getLatestStalePendingWithdrawalsAlert();
    }

    @Post('stale-pending-withdrawals/run')
    @AdminRoles(AdminRole.Support)
    runStalePendingWithdrawalsCheckManually() {
        return this.systemAlertsService.runStalePendingWithdrawalsCheckManually();
    }
}
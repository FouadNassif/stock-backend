import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminJwtAuthGuard } from '../admin/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRole } from '../admin/schemas/admin.schema';
import { AnalyticsService } from './analytics.service';
import { ActiveMembersQueryDto } from './dto/active-members-query.dto';
import { AnalyticsVolumeQueryDto } from './dto/analytics-volume-query.dto';
import { TopStocksQueryDto } from './dto/top-stocks-query.dto';

@Controller('analytics')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.Admin, AdminRole.Analyst)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('volume')
    getTradingVolume(@Query() query: AnalyticsVolumeQueryDto) {
        return this.analyticsService.getTradingVolume(query);
    }

    @Get('stocks/top')
    getTopTradedStocks(@Query() query: TopStocksQueryDto) {
        return this.analyticsService.getTopTradedStocks(query);
    }

    @Get('aum')
    getAum() {
        return this.analyticsService.getAum();
    }

    @Get('members/active')
    getActiveMembers(@Query() query: ActiveMembersQueryDto) {
        return this.analyticsService.getActiveMembers(query);
    }

    @Get('sectors')
    getSectorAllocation() {
        return this.analyticsService.getSectorAllocation();
    }

    @Get('admin/summary')
    @AdminRoles(AdminRole.Admin)
    getAdminSummary() {
        return this.analyticsService.getAdminSummary();
    }
}
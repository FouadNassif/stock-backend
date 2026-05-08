import { Body, Controller, Get, Post, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ListAdminsQueryDto } from './dto/list-admins-query.dto';
import { AdminRole } from './schemas/admin.schema';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from './guards/admin-roles.guard';
import { AdminRoles } from './decorators/admin-roles.decorator';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { CreateAdminDto } from './dto/create-admin.dto';
import type { AdminJwtPayload } from './types/admin-jwt-payload.type';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';


@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Post('auth/login')
    login(@Body() dto: AdminLoginDto): Promise<{
        accessToken: string;
        mustChangePassword: boolean;
        role: AdminRole;
    }> {
        return this.adminService.login(dto);
    }

    @Post('auth/change-password')
    @UseGuards(AdminJwtAuthGuard)
    changePassword(
        @CurrentAdmin() currentAdmin: AdminJwtPayload,
        @Body() dto: ChangeAdminPasswordDto,
    ): Promise<{ message: string }> {
        return this.adminService.changePassword(currentAdmin.sub, dto);
    }

    @Post('users')
    @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
    @AdminRoles(AdminRole.Admin)
    createAdminUser(
        @CurrentAdmin() currentAdmin: AdminJwtPayload,
        @Body() dto: CreateAdminDto,
    ) {
        return this.adminService.createAdmin(currentAdmin.sub, dto);
    }

    @Get('users')
    @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
    @AdminRoles(AdminRole.Admin)
    listAdmins(@Query() query: ListAdminsQueryDto) {
        return this.adminService.listAdmins(query);
    }
}
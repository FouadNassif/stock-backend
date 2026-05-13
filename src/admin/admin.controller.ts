import { Body, Controller, Get, Param, Post, UseGuards, Query } from '@nestjs/common';
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
import { WalletService } from '../wallet/wallet.service';
import { ListWithdrawalsQueryDto } from '../wallet/dto/list-withdrawals-query.dto';
import { RejectWithdrawalDto } from '../wallet/dto/reject-withdrawal.dto';
import { RejectIdentityDto } from './dto/reject-identity.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';
import { ObjectIdPipe } from 'src/common/pipes/object-id.pipe';
import { ManualWalletAdjustmentDto } from './dto/manual-wallet-adjustment.dto';
import { MemberStatusDto } from './dto/member-status-dto';


@Controller('admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly walletService: WalletService,
    ) { }

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

    @Get('members')
    @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
    @AdminRoles(AdminRole.Admin, AdminRole.Support)
    listMembers(@Query() query: ListMembersQueryDto) {
        return this.adminService.listMembers(query);
    }

    @Get('withdrawals')
    @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
    @AdminRoles(AdminRole.Admin)
    listWithdrawals(@Query() query: ListWithdrawalsQueryDto) {
        return this.walletService.listWithdrawals(query);
    }

    @Post('withdrawals/:id/approve')
    @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
    @AdminRoles(AdminRole.Admin)
    approveWithdrawal(
        @Param('id', ObjectIdPipe) id: string,
        @CurrentAdmin() currentAdmin: AdminJwtPayload,
    ) {
        return this.walletService.approveWithdrawal(id, currentAdmin.sub);
    }

    @Post('withdrawals/:id/reject')
    @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
    @AdminRoles(AdminRole.Admin)
    rejectWithdrawal(
        @Param('id', ObjectIdPipe) id: string,
        @CurrentAdmin() currentAdmin: AdminJwtPayload,
        @Body() dto: RejectWithdrawalDto,
    ) {
        return this.walletService.rejectWithdrawal(id, currentAdmin.sub, dto);
    }

    @Post('members/:id/identity/approve')
    @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
    @AdminRoles(AdminRole.Admin)
    approveIdentity(@Param('id', ObjectIdPipe) id: string, @CurrentAdmin() currentAdmin: AdminJwtPayload,) {
        return this.adminService.approveIdentity(id, currentAdmin.sub);
    }

    @Post('members/:id/identity/reject')
    @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
    @AdminRoles(AdminRole.Admin)
    rejectIdentity(@Param('id', ObjectIdPipe) id: string, @Body() dto: RejectIdentityDto, @CurrentAdmin() currentAdmin: AdminJwtPayload,) {
        return this.adminService.rejectIdentity(id, currentAdmin.sub, dto);
    }

    @Post('members/:id/status/activate')
    @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
    @AdminRoles(AdminRole.Admin)
    activateMember(@Param('id', ObjectIdPipe) id: string, @CurrentAdmin() currentAdmin: AdminJwtPayload, @Body() dto: MemberStatusDto) {
        return this.adminService.activateMember(id, dto, currentAdmin.sub);
    }

    @Post('members/:id/status/suspend')
    @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
    @AdminRoles(AdminRole.Admin)
    suspendMember(@Param('id', ObjectIdPipe) id: string, @Body() dto: MemberStatusDto, @CurrentAdmin() currentAdmin: AdminJwtPayload) {
        return this.adminService.suspendMember(id, dto, currentAdmin.sub);
    }

    @Post('members/:id/wallet-adjustments')
    @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
    @AdminRoles(AdminRole.Admin)
    adjustMemberWallet(
        @Param('id', ObjectIdPipe) memberId: string,
        @CurrentAdmin() currentAdmin: AdminJwtPayload,
        @Body() dto: ManualWalletAdjustmentDto,
    ) {
        return this.adminService.adjustMemberWallet(
            memberId,
            currentAdmin.sub,
            dto,
        );
    }
}
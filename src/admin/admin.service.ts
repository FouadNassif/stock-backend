import { Injectable, OnModuleInit, ConflictException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types, Connection } from 'mongoose';

import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRole, Admin, AdminDocument } from './schemas/admin.schema';
import { AdminJwtPayload } from './types/admin-jwt-payload.type';
import { CreateAdminDto } from './dto/create-admin.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { generateTemporaryPassword } from '../common/utils/password.util';
import { ListAdminsQueryDto } from './dto/list-admins-query.dto';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';
import { IdentityStatus, Member, MemberDocument } from '../members/schemas/member.schema';
import { RejectIdentityDto } from './dto/reject-identity.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';
import { MemberStatusDto } from './dto/member-status-dto';
import { Transaction, TransactionDocument } from '../wallet/schemas/transaction.schema';
import { ManualWalletAdjustmentDto, WalletAdjustmentType } from './dto/manual-wallet-adjustment.dto';
import { generateTransactionReference } from '../wallet/utils/transaction.utils';
import { toTransactionResponse } from '../wallet/mappers/transaction.mapper';
import { TransactionResponse } from '../wallet/types/transaction-response.type';
import { TransactionStatus, TransactionType } from '../wallet/types/transaction.type';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditActorType, AuditLogAction, AuditTargetType } from '../audit-logs/types/audit-log-action.type';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { ListTransactionsQueryDto } from '../wallet/dto/list-transactions-query.dto';
import { ListOrdersQueryDto } from '../orders/dto/list-orders-query.dto';
import { toOrderResponse } from '../orders/mappers/order.mappers';
import { MessagingService } from 'src/messaging/messaging.service';
import { NotificationEventType } from 'src/messaging/types/notification-event.type';

type AdminListFilter = {
    role?: AdminRole;
    isActive?: boolean;
    $or?: {
        fullName?: RegExp;
        email?: RegExp;
    }[];
};
type MemberListFilter = {
    identityStatus?: IdentityStatus;
    isActive?: boolean;
    emailVerified?: boolean;
    $or?: {
        fullName?: RegExp;
        email?: RegExp;
        nationalId?: RegExp;
        referralCode?: RegExp;
    }[];
};

@Injectable()
export class AdminService implements OnModuleInit {
    constructor(
        @InjectConnection()
        private readonly connection: Connection,

        @InjectModel(Transaction.name)
        private readonly transactionModel: Model<TransactionDocument>,

        @InjectModel(Admin.name)
        private readonly adminModel: Model<AdminDocument>,

        @InjectModel(Member.name)
        private readonly memberModel: Model<MemberDocument>,

        @InjectModel(Order.name)
        private readonly orderModel: Model<OrderDocument>,

        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly notificationsService: NotificationsService,
        private readonly auditLogsService: AuditLogsService,
        private readonly messagingService: MessagingService,
    ) { }

    async onModuleInit(): Promise<void> {
        await this.seedDefaultAdmin();
    }

    async login(dto: AdminLoginDto): Promise<{
        accessToken: string;
        mustChangePassword: boolean;
        role: AdminRole;
    }> {
        const normalizedEmail = dto.email.toLowerCase();

        const adminUser = await this.adminModel
            .findOne({ email: normalizedEmail })
            .exec();

        if (!adminUser) {
            throw new UnauthorizedException('Invalid email or password');
        }

        if (!adminUser.isActive) {
            throw new UnauthorizedException('Admin account is inactive');
        }

        const isPasswordValid = await bcrypt.compare(
            dto.password,
            adminUser.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        adminUser.lastLoginAt = new Date();
        await adminUser.save();

        const payload: AdminJwtPayload = {
            sub: adminUser._id.toString(),
            email: adminUser.email,
            type: 'admin',
            role: adminUser.role,
        };

        return {
            accessToken: await this.jwtService.signAsync(payload),
            mustChangePassword: adminUser.mustChangePassword,
            role: adminUser.role,
        };
    }

    async createAdmin(currentAdminId: string, dto: CreateAdminDto) {
        const normalizedEmail = dto.email.toLowerCase();

        const existingAdmin = await this.adminModel.findOne({ email: normalizedEmail }).exec();

        const existingMemberEmail = await this.memberModel.findOne({ email: normalizedEmail }).exec();

        if (existingAdmin || existingMemberEmail) {
            throw new ConflictException('Email already exists');
        }

        const temporaryPassword = generateTemporaryPassword();

        const password = await bcrypt.hash(temporaryPassword, 10);

        const newAdmin = await this.adminModel.create({
            fullName: dto.fullName,
            email: normalizedEmail,
            password,
            role: dto.role,
            isActive: true,
            mustChangePassword: true,
            createdBy: currentAdminId,
        });

        await this.messagingService.publishNotification({
            type: NotificationEventType.NewAdminEmailRequested,
            payload: {
                email: newAdmin.email,
                fullName: newAdmin.fullName,
                tempPassword: temporaryPassword,
            },
        });

        await this.auditLogsService.create({
            actorId: currentAdminId,
            actorType: AuditActorType.Admin,
            action: AuditLogAction.AdminCreated,
            targetType: AuditTargetType.Admin,
            targetId: newAdmin._id.toString(),
            description: 'CMS user created by admin',
            metadata: {
                createdAdminEmail: newAdmin.email,
                createdAdminFullName: newAdmin.fullName,
                createdAdminRole: newAdmin.role,
            },
        });

        return {
            id: newAdmin._id.toString(),
            fullName: newAdmin.fullName,
            email: newAdmin.email,
            role: newAdmin.role,
            isActive: newAdmin.isActive,
            mustChangePassword: newAdmin.mustChangePassword,
            createdBy: newAdmin.createdBy,
        };
    }


    async listAdmins(query: ListAdminsQueryDto): Promise<{
        data: {
            id: string;
            fullName: string;
            email: string;
            role: string;
            isActive: boolean;
            mustChangePassword: boolean;
            createdBy?: string;
            lastLoginAt?: Date;
        }[];
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

        const filter: AdminListFilter = {};

        if (query.role) {
            filter.role = query.role;
        }

        if (typeof query.isActive === 'boolean') {
            filter.isActive = query.isActive;
        }

        if (query.search) {
            const searchRegex = new RegExp(query.search, 'i');

            filter.$or = [
                { fullName: searchRegex },
                { email: searchRegex },
            ];
        }

        const [admins, total] = await Promise.all([
            this.adminModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('-passwordHash')
                .exec(),

            this.adminModel.countDocuments(filter).exec(),
        ]);

        return {
            data: admins.map((admin) => ({
                id: admin._id.toString(),
                fullName: admin.fullName,
                email: admin.email,
                role: admin.role,
                isActive: admin.isActive,
                mustChangePassword: admin.mustChangePassword,
                createdBy: admin.createdBy?.toString(),
                lastLoginAt: admin.lastLoginAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async listMembers(query: ListMembersQueryDto): Promise<{
        data: {
            id: string;
            fullName: string;
            email: string;
            nationalId: string;
            dateOfBirth: Date;
            emailVerified: boolean;
            identityStatus: IdentityStatus;
            isActive: boolean;
            walletBalance: number;
            lastDepositAt?: Date;
            referralCode: string;
            createdAt?: Date;
            updatedAt?: Date;
        }[];
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

        const filter: MemberListFilter = {};

        if (query.identityStatus) {
            filter.identityStatus = query.identityStatus;
        }

        if (typeof query.isActive === 'boolean') {
            filter.isActive = query.isActive;
        }

        if (typeof query.emailVerified === 'boolean') {
            filter.emailVerified = query.emailVerified;
        }

        if (query.search) {
            const searchRegex = new RegExp(query.search, 'i');

            filter.$or = [
                { fullName: searchRegex },
                { email: searchRegex },
                { nationalId: searchRegex },
                { referralCode: searchRegex },
            ];
        }

        const [members, total] = await Promise.all([
            this.memberModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('-password')
                .exec(),

            this.memberModel.countDocuments(filter).exec(),
        ]);

        return {
            data: members.map((member) => ({
                id: member._id.toString(),
                fullName: member.fullName,
                email: member.email,
                nationalId: member.nationalId,
                dateOfBirth: member.dateOfBirth,
                emailVerified: member.emailVerified,
                identityStatus: member.identityStatus,
                isActive: member.isActive,
                walletBalance: member.walletBalance,
                lastDepositAt: member.lastDepositAt,
                referralCode: member.referralCode,
                createdAt: member.createdAt,
                updatedAt: member.updatedAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getMemberById(memberId: string): Promise<{
        id: string;
        fullName: string;
        email: string;
        nationalId: string;
        dateOfBirth: Date;
        emailVerified: boolean;
        referralCode: string;
        identityStatus: string;
        isActive: boolean;
        walletBalance: number;
        lastDepositAt?: Date;
        createdAt?: Date;
        updatedAt?: Date;
    }> {
        const member = await this.memberModel
            .findById(memberId)
            .select('-password')
            .exec();

        if (!member) {
            throw new NotFoundException('Member not found');
        }

        return {
            id: member._id.toString(),
            fullName: member.fullName,
            email: member.email,
            nationalId: member.nationalId,
            dateOfBirth: member.dateOfBirth,
            emailVerified: member.emailVerified,
            referralCode: member.referralCode,
            identityStatus: member.identityStatus,
            isActive: member.isActive,
            walletBalance: member.walletBalance,
            lastDepositAt: member.lastDepositAt,
            createdAt: member.createdAt,
            updatedAt: member.updatedAt,
        };
    }

    async getMemberTransactions(
        memberId: string,
        query: ListTransactionsQueryDto,
    ): Promise<{
        data: ReturnType<typeof toTransactionResponse>[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }> {
        const member = await this.memberModel.findById(memberId).exec();

        if (!member) {
            throw new NotFoundException('Member not found');
        }

        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const filter: {
            memberId: Types.ObjectId;
            type?: typeof query.type;
            status?: typeof query.status;
            createdAt?: {
                $gte?: Date;
                $lte?: Date;
            };
        } = {
            memberId: member._id,
        };

        if (query.type) {
            filter.type = query.type;
        }

        if (query.status) {
            filter.status = query.status;
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

        const [transactions, total] = await Promise.all([
            this.transactionModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),

            this.transactionModel.countDocuments(filter).exec(),
        ]);

        return {
            data: transactions.map((transaction) =>
                toTransactionResponse(transaction),
            ),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getMemberOrders(
        memberId: string,
        query: ListOrdersQueryDto,
    ): Promise<{
        data: ReturnType<typeof toOrderResponse>[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }> {
        const member = await this.memberModel.findById(memberId).exec();

        if (!member) {
            throw new NotFoundException('Member not found');
        }

        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const filter: {
            memberId: Types.ObjectId;
            type?: typeof query.type;
            status?: typeof query.status;
            createdAt?: {
                $gte?: Date;
                $lte?: Date;
            };
        } = {
            memberId: member._id,
        };

        if (query.type) {
            filter.type = query.type;
        }

        if (query.status) {
            filter.status = query.status;
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

        const [orders, total] = await Promise.all([
            this.orderModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),

            this.orderModel.countDocuments(filter).exec(),
        ]);

        return {
            data: orders.map((order) => toOrderResponse(order)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }


    async changePassword(
        currentAdminId: string,
        dto: ChangeAdminPasswordDto,
    ): Promise<{ message: string }> {
        const adminUser = await this.adminModel.findById(currentAdminId).exec();

        if (!adminUser) {
            throw new UnauthorizedException('Invalid admin account');
        }

        if (!adminUser.isActive) {
            throw new UnauthorizedException('Admin account is inactive');
        }

        const isCurrentPasswordValid = await bcrypt.compare(
            dto.currentPassword,
            adminUser.password,
        );

        if (dto.currentPassword === dto.newPassword) {
            throw new ConflictException('New password must be different from the current password');
        }

        if (!isCurrentPasswordValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        adminUser.password = await bcrypt.hash(dto.newPassword, 10);
        adminUser.mustChangePassword = false;

        await adminUser.save();

        return {
            message: 'Password changed successfully.',
        };
    }

    async approveIdentity(memberId: string, currentAdminId: string): Promise<{ message: string }> {
        const member = await this.memberModel.findById(memberId).exec();

        if (!member) {
            throw new NotFoundException('Member not found');
        }

        if (member.identityStatus === IdentityStatus.Approved) {
            throw new BadRequestException('Identity is already approved');
        }
        const previousStatus = member.identityStatus;

        member.identityStatus = IdentityStatus.Approved;
        await member.save();

        await this.messagingService.publishNotification({
            type: NotificationEventType.IdentityApprovedEmailRequested,
            payload: {
                email: member.email,
                fullName: member.fullName,
            },
        });

        await this.auditLogsService.create({
            actorId: currentAdminId,
            actorType: AuditActorType.Admin,
            action: AuditLogAction.MemberIdentityApproved,
            targetType: AuditTargetType.Member,
            targetId: member._id.toString(),
            description: 'Member identity approved by admin',
            changes: {
                identityStatus: {
                    before: previousStatus,
                    after: member.identityStatus,
                },
            },
            metadata: {
                memberEmail: member.email,
                memberFullName: member.fullName,
            },
        });

        return {
            message: 'Identity approved successfully',
        };
    }

    async rejectIdentity(memberId: string, currentAdminId: string, dto: RejectIdentityDto): Promise<{ message: string }> {
        const member = await this.memberModel.findById(memberId).exec();

        if (!member) {
            throw new NotFoundException('Member not found');
        }

        if (member.identityStatus === IdentityStatus.Rejected) {
            throw new BadRequestException('Identity is already rejected');
        }

        const previousStatus = member.identityStatus;
        member.identityStatus = IdentityStatus.Rejected;
        await member.save();

        await this.messagingService.publishNotification({
            type: NotificationEventType.IdentityRejectedEmailRequested,
            payload: {
                email: member.email,
                fullName: member.fullName,
                reason: dto.reason,
            },
        });

        await this.auditLogsService.create({
            actorId: currentAdminId,
            actorType: AuditActorType.Admin,
            action: AuditLogAction.MemberIdentityRejected,
            targetType: AuditTargetType.Member,
            targetId: member._id.toString(),
            description: 'Member identity rejected by admin',
            reason: dto.reason,
            changes: {
                identityStatus: {
                    before: previousStatus,
                    after: member.identityStatus,
                },
            },
            metadata: {
                memberEmail: member.email,
                memberFullName: member.fullName,
            },
        });


        return {
            message: 'Identity rejected successfully',
        };
    }

    async activateMember(
        memberId: string,
        dto: MemberStatusDto,
        currentAdminId: string
    ): Promise<{ message: string }> {
        const member = await this.memberModel.findById(memberId).exec();

        if (!member) {
            throw new NotFoundException('Member not found');
        }

        if (member.isActive === true) {
            throw new BadRequestException('Member is already activated');
        }
        const previousStatus = member.isActive;
        member.isActive = true;
        await member.save();

        await this.auditLogsService.create({
            actorId: currentAdminId,
            actorType: AuditActorType.Admin,
            action: AuditLogAction.MemberReinstated,
            targetType: AuditTargetType.Member,
            targetId: member._id.toString(),
            description: 'Member account reinstated by admin',
            reason: dto.reason,
            changes: {
                isActive: {
                    before: previousStatus,
                    after: member.isActive,
                },
            },
            metadata: {
                memberEmail: member.email,
                memberFullName: member.fullName,
            },
        });

        return {
            message: 'Member activated successfully',
        };
    }

    async suspendMember(
        memberId: string,
        dto: MemberStatusDto,
        currentAdminId: string
    ): Promise<{ message: string }> {
        const member = await this.memberModel.findById(memberId).exec();

        if (!member) {
            throw new NotFoundException('Member not found');
        }

        if (member.isActive === false) {
            throw new BadRequestException('Member is already suspended');
        }
        const previousStatus = member.isActive;
        member.isActive = false;
        await member.save();

        await this.messagingService.publishNotification({
            type: NotificationEventType.MemberSuspendedEmailRequested,
            payload: {
                email: member.email,
                fullName: member.fullName,
                reason: dto.reason,
            },
        });

        await this.auditLogsService.create({
            actorId: currentAdminId,
            actorType: AuditActorType.Admin,
            action: AuditLogAction.MemberSuspended,
            targetType: AuditTargetType.Member,
            targetId: member._id.toString(),
            description: 'Member account suspended by admin',
            reason: dto.reason,
            changes: {
                isActive: {
                    before: previousStatus,
                    after: member.isActive,
                },
            },
            metadata: {
                memberEmail: member.email,
                memberFullName: member.fullName,
            },
        });

        return {
            message: 'Member suspended successfully',
        };
    }

    async adjustMemberWallet(
        memberId: string,
        currentAdminId: string,
        dto: ManualWalletAdjustmentDto,
    ): Promise<{
        message: string;
        walletBalance: number;
        transaction: TransactionResponse;
    }> {
        const session = await this.connection.startSession();

        let response!: {
            message: string;
            walletBalance: number;
            transaction: TransactionResponse;
        };

        try {
            await session.withTransaction(async () => {
                const member = await this.memberModel.findById(memberId).session(session).exec();

                if (!member) {
                    throw new NotFoundException('Member not found');
                }

                const balanceBefore = member.walletBalance;

                const adjustmentAmount = dto.type === WalletAdjustmentType.Credit ? dto.amount : -dto.amount;

                const balanceAfter = balanceBefore + adjustmentAmount;

                if (balanceAfter < 0) {
                    throw new BadRequestException('Wallet adjustment cannot make member balance negative');
                }

                member.walletBalance = balanceAfter;
                await member.save({ session });

                const createdTransactions = await this.transactionModel.create(
                    [
                        {
                            memberId: member._id,
                            type: TransactionType.Adjustment,
                            amount: dto.amount,
                            status: TransactionStatus.Completed,
                            referenceId: generateTransactionReference(
                                TransactionType.Adjustment,
                            ),
                            notes: `Manual wallet ${dto.type} by admin ${currentAdminId}. Reason: ${dto.reason}`,
                            balanceBefore,
                            balanceAfter,
                            processedAt: new Date(),
                        },
                    ],
                    { session },
                );

                const transaction = createdTransactions[0];

                await this.auditLogsService.create(
                    {
                        actorId: currentAdminId,
                        actorType: AuditActorType.Admin,
                        action: AuditLogAction.WalletAdjusted,
                        targetType: AuditTargetType.Member,
                        targetId: member._id.toString(),
                        description: `Manual wallet ${dto.type} performed by admin`,
                        reason: dto.reason,
                        changes: {
                            walletBalance: {
                                before: balanceBefore,
                                after: balanceAfter,
                            },
                        },
                        metadata: {
                            adjustmentType: dto.type,
                            amount: dto.amount,
                            transactionId: transaction._id.toString(),
                            memberEmail: member.email,
                            memberFullName: member.fullName,
                        },
                    },
                    session,
                );

                response = {
                    message: 'Member wallet adjusted successfully',
                    walletBalance: member.walletBalance,
                    transaction: toTransactionResponse(transaction),
                };
            });
        } finally {
            await session.endSession();
        }

        return response;
    }

    private async seedDefaultAdmin(): Promise<void> {
        const adminEmail = this.configService.getOrThrow<string>('ADMIN_EMAIL').toLowerCase();

        const existingAdmin = await this.adminModel.findOne({ email: adminEmail }).exec();

        if (existingAdmin) {
            return;
        }

        const adminPassword = this.configService.getOrThrow<string>('ADMIN_PASSWORD');
        const adminFullName = this.configService.getOrThrow<string>('ADMIN_FULL_NAME');
        const password = await bcrypt.hash(adminPassword, 10);

        await this.adminModel.create({
            fullName: adminFullName,
            email: adminEmail,
            password,
            role: AdminRole.Admin,
            isActive: true,
            mustChangePassword: false,
        });
    }
}
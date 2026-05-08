import {
    Injectable,
    OnModuleInit,
    ConflictException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';

import { AdminLoginDto } from './dto/admin-login.dto';
import {
    AdminRole,
    Admin,
    AdminDocument,
} from './schemas/admin.schema';
import { AdminJwtPayload } from './types/admin-jwt-payload.type';
import { CreateAdminDto } from './dto/create-admin.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { generateTemporaryPassword } from 'src/common/utils/password.util';

import { ListAdminsQueryDto } from './dto/list-admins-query.dto';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';

type AdminListFilter = {
    role?: AdminRole;
    isActive?: boolean;
    $or?: {
        fullName?: RegExp;
        email?: RegExp;
    }[];
};

@Injectable()
export class AdminService implements OnModuleInit {
    constructor(
        @InjectModel(Admin.name)
        private readonly adminModel: Model<AdminDocument>,

        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly notificationsService: NotificationsService,
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

        const existingAdmin = await this.adminModel
            .findOne({ email: normalizedEmail })
            .exec();

        if (existingAdmin) {
            throw new ConflictException('Email already exists');
        }

        const temporaryPassword = generateTemporaryPassword();

        const passwordHash = await bcrypt.hash(temporaryPassword, 10);

        const newAdmin = await this.adminModel.create({
            fullName: dto.fullName,
            email: normalizedEmail,
            password: passwordHash,
            role: dto.role,
            isActive: true,
            mustChangePassword: true,
            createdBy: currentAdminId,
        });

        await this.notificationsService.sendNewAdminEmail(
            newAdmin.email,
            temporaryPassword,
            newAdmin.fullName,
        );

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

    private async seedDefaultAdmin(): Promise<void> {
        const adminEmail = this.configService
            .getOrThrow<string>('ADMIN_EMAIL')
            .toLowerCase();

        const existingAdmin = await this.adminModel
            .findOne({ email: adminEmail })
            .exec();

        if (existingAdmin) {
            return;
        }

        const adminPassword =
            this.configService.getOrThrow<string>('ADMIN_PASSWORD');

        const adminFullName =
            this.configService.getOrThrow<string>('ADMIN_FULL_NAME');

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
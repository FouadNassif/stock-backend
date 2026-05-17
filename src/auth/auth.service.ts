import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Otp, OtpDocument, OtpPurpose } from './schemas/otp.schema';
import { JwtPayload } from './types/jwt-payload.type';
import { generateOtpCode, isAdult, generateReferralCode } from '../common/utils/auth.util';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { ReferralsService } from '../referrals/referrals.service';
import { Admin, AdminDocument } from '../admin/schemas/admin.schema';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { PasswordResetTokenPayload } from './types/password-reset-token-payload.type';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RedisService } from 'src/common/redis/redis.service';
import { AuthRateLimitAction, buildAuthComboRateLimitKey, buildAuthIpRateLimitKey } from './utils/auth-rate-limit.util';
import { throwRateLimitException } from 'src/common/exceptions/rate-limit.exception';
import { NotificationEventType } from 'src/messaging/types/notification-event.type';
import { MessagingService } from 'src/messaging/messaging.service';
import { PasswordSetupTokenPayload } from './types/src/auth/types/password-setup-token-payload.type';


@Injectable()
export class AuthService {
    constructor(
        @InjectModel(Member.name)
        private readonly memberModel: Model<MemberDocument>,

        @InjectModel(Otp.name)
        private readonly otpModel: Model<OtpDocument>,

        @InjectModel(Admin.name)
        private readonly adminModel: Model<AdminDocument>,

        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly notificationsService: NotificationsService,
        private readonly referralsService: ReferralsService,
        private readonly redisService: RedisService,
        private readonly messagingService: MessagingService,
    ) { }

    async register(
        dto: RegisterDto,
        referralCode: string | undefined,
        ipAddress: string,
    ): Promise<{ memberId: string; verificationId: string; message: string }> {
        const normalizedEmail = dto.email.toLowerCase();

        await this.redisRateCheckLimit(
            normalizedEmail,
            ipAddress,
            AuthRateLimitAction.Register,
            {
                stage1Limit: this.configService.getOrThrow<number>('RATE_REGISTER_STAGE1_LIMIT'),
                stage1Time: this.configService.getOrThrow<number>('RATE_REGISTER_STAGE1_TIME'),
                stage2Limit: this.configService.getOrThrow<number>('RATE_REGISTER_STAGE2_LIMIT'),
                stage2Time: this.configService.getOrThrow<number>('RATE_REGISTER_STAGE2_TIME'),
            },
        );

        const existingMember = await this.memberModel
            .findOne({
                $or: [{ email: normalizedEmail }, { nationalId: dto.nationalId }],
            }).exec();

        const existingAdmin = await this.adminModel.findOne({ email: normalizedEmail }).exec();

        if (existingMember || existingAdmin) {
            throw new ConflictException('Email or national ID already exists');
        }

        const dateOfBirth = new Date(dto.dateOfBirth);

        if (!isAdult(dateOfBirth)) {
            throw new BadRequestException('Member must be at least 18 years old');
        }

        let validReferralCode: string | undefined;

        if (referralCode) {
            const normalizedReferralCode = referralCode.trim().toUpperCase();

            const referrer = await this.memberModel.findOne({ referralCode: normalizedReferralCode }).exec();

            if (!referrer || !referrer.isActive) {
                throw new BadRequestException('Invalid referral code');
            }

            validReferralCode = normalizedReferralCode;
        }

        const memberReferralCode = await this.generateUniqueReferralCode(dto.fullName);

        const member: MemberDocument = await this.memberModel.create({
            fullName: dto.fullName,
            email: normalizedEmail,
            nationalId: dto.nationalId,
            dateOfBirth,
            emailVerified: false,
            isActive: true,
            walletBalance: 0,
            referralCode: memberReferralCode,
        });

        await this.referralsService.createReferralIfCodeProvided({
            referralCode: validReferralCode,
            referredMemberId: member._id,
        });

        const verificationId = await this.createAndSendOtp(member);

        return {
            memberId: member._id.toString(),
            verificationId,
            message: 'Registration successful. Please verify your email OTP.',
        };
    }

    async verifyOtp(dto: VerifyOtpDto, ipAddress: string): Promise<{ message: string, setupPasswordToken?: string; }> {
        await this.redisRateCheckLimit(
            dto.verificationId,
            ipAddress,
            AuthRateLimitAction.VerifyOtp,
            {
                stage1Limit: this.configService.getOrThrow<number>('RATE_V_OTP_STAGE1_LIMIT'),
                stage1Time: this.configService.getOrThrow<number>('RATE_V_OTP_STAGE1_TIME'),
                stage2Limit: this.configService.getOrThrow<number>('RATE_V_OTP_STAGE2_LIMIT'),
                stage2Time: this.configService.getOrThrow<number>('RATE_V_OTP_STAGE2_TIME'),
            },
        );

        const otp = await this.otpModel
            .findOne({
                verificationId: dto.verificationId,
                purpose: OtpPurpose.EmailVerification,
                used: false,
                expiresAt: { $gt: new Date() },
            })
            .exec();

        if (!otp) {
            throw new BadRequestException('OTP is invalid or expired');
        }

        if (otp.attempts >= otp.maxAttempts) {
            otp.used = true;
            otp.usedAt = new Date();
            await otp.save();

            throw new BadRequestException('OTP is invalid or expired');
        }

        const isCodeValid = await bcrypt.compare(dto.code, otp.codeHash);

        if (!isCodeValid) {
            otp.attempts += 1;
            await otp.save();

            throw new BadRequestException('OTP is invalid or expired');
        }

        const member = await this.memberModel.findById(otp.memberId).exec();

        if (!member) {
            throw new BadRequestException('OTP is invalid or expired');
        }

        if (member.emailVerified) {
            otp.used = true;
            otp.usedAt = new Date();
            await otp.save();

            return {
                message: 'Email is already verified.',
            };
        }

        otp.used = true;
        otp.usedAt = new Date();
        await otp.save();

        member.emailVerified = true;
        await member.save();

        const payload: PasswordSetupTokenPayload = {
            sub: member._id.toString(),
            email: member.email,
            type: 'password-setup',
        };

        const setupPasswordToken = await this.jwtService.signAsync(payload, {
            expiresIn: '15m',
        });

        return {
            message: 'Email verified successfully. You can now set your password.',
            setupPasswordToken
        };
    }

    async resendOtp(dto: ResendOtpDto, ipAddress: string): Promise<{ verificationId: string; message: string }> {
        await this.redisRateCheckLimit(
            dto.verificationId,
            ipAddress,
            AuthRateLimitAction.ResendOtp,
            {
                stage1Limit: this.configService.getOrThrow<number>('RATE_R_OTP_STAGE1_LIMIT'),
                stage1Time: this.configService.getOrThrow<number>('RATE_R_OTP_STAGE1_TIME'),
                stage2Limit: this.configService.getOrThrow<number>('RATE_R_OTP_STAGE2_LIMIT'),
                stage2Time: this.configService.getOrThrow<number>('RATE_R_OTP_STAGE2_TIME'),
            },
        );
        const oldOtp = await this.otpModel
            .findOne({
                verificationId: dto.verificationId,
                purpose: OtpPurpose.EmailVerification,
                used: false,
            })
            .exec();

        if (!oldOtp) {
            throw new BadRequestException('Verification session is invalid or expired');
        }

        const member = await this.memberModel.findById(oldOtp.memberId).exec();

        if (!member) {
            throw new BadRequestException('Verification session is invalid or expired');
        }

        if (member.emailVerified) {
            throw new BadRequestException('Email is already verified');
        }

        oldOtp.used = true;
        oldOtp.usedAt = new Date();
        await oldOtp.save();

        const newVerificationId = await this.createAndSendOtp(member);

        return {
            verificationId: newVerificationId,
            message: 'A new OTP has been sent to your email.',
        };
    }

    async setPassword(dto: SetPasswordDto): Promise<{ message: string }> {
        let payload: PasswordSetupTokenPayload;

        try {
            payload = await this.jwtService.verifyAsync<PasswordSetupTokenPayload>(
                dto.setupPasswordToken,
            );
        } catch {
            throw new UnauthorizedException('Invalid or expired password setup token');
        }

        if (payload.type !== 'password-setup') {
            throw new UnauthorizedException('Invalid password setup token');
        }

        const member = await this.memberModel.findById(payload.sub).exec();

        if (!member) {
            throw new BadRequestException('Member not found');
        }

        if (!member.emailVerified) {
            throw new ForbiddenException(
                'Please verify your email before setting a password',
            );
        }

        if (member.password) {
            throw new BadRequestException(
                'Password is already set. Please use change password or forgot password.',
            );
        }

        member.password = await bcrypt.hash(dto.password, 10);
        await member.save();

        return {
            message: 'Password set successfully. You can now login.',
        };
    }

    async login(dto: LoginDto, ipAddress: string,): Promise<{ accessToken: string }> {
        const normalizedEmail = dto.email.toLowerCase();

        await this.redisRateCheckLimit(
            normalizedEmail,
            ipAddress,
            AuthRateLimitAction.Login,
            {
                stage1Limit: this.configService.getOrThrow<number>('RATE_LOGIN_STAGE1_LIMIT'),
                stage1Time: this.configService.getOrThrow<number>('RATE_LOGIN_STAGE1_TIME'),
                stage2Limit: this.configService.getOrThrow<number>('RATE_LOGIN_STAGE2_LIMIT'),
                stage2Time: this.configService.getOrThrow<number>('RATE_LOGIN_STAGE2_TIME'),
            },
        );

        const member = await this.memberModel
            .findOne({ email: normalizedEmail })
            .exec();

        if (!member || !member.password) {
            throw new UnauthorizedException('Invalid email or password');
        }

        if (!member.emailVerified) {
            throw new ForbiddenException('Please verify your email before logging in');
        }

        if (!member.isActive) {
            throw new ForbiddenException('Your account is suspended');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, member.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        await this.redisService.delete(
            buildAuthComboRateLimitKey({
                action: AuthRateLimitAction.Login,
                target: normalizedEmail,
                ipAddress,
            }),
        );

        const payload: JwtPayload = {
            sub: member._id.toString(),
            email: member.email,
            type: 'member',
        };

        return {
            accessToken: await this.jwtService.signAsync(payload),
        };
    }

    async forgotPassword(dto: ForgotPasswordDto, ipAddress: string): Promise<{
        verificationId?: string;
        message: string;
    }> {
        const normalizedEmail = dto.email.toLowerCase();

        await this.redisRateCheckLimit(
            normalizedEmail,
            ipAddress,
            AuthRateLimitAction.ForgotPassword,
            {
                stage1Limit: this.configService.getOrThrow<number>('RATE_FORGET_STAGE1_LIMIT'),
                stage1Time: this.configService.getOrThrow<number>('RATE_FORGET_STAGE1_TIME'),
                stage2Limit: this.configService.getOrThrow<number>('RATE_FORGET_STAGE2_LIMIT'),
                stage2Time: this.configService.getOrThrow<number>('RATE_FORGET_STAGE2_TIME'),
            },
        );

        const genericMessage = 'If this email exists, a password reset OTP has been sent.';

        const member = await this.memberModel
            .findOne({ email: normalizedEmail })
            .exec();

        if (!member) {
            return {
                message: genericMessage,
            };
        }

        if (!member.isActive) {
            return {
                message: genericMessage,
            };
        }

        if (!member.emailVerified) {
            return {
                message: genericMessage,
            };
        }

        const code = generateOtpCode();
        const codeHash = await bcrypt.hash(code, 10);
        const verificationId = randomUUID();

        const otpExpiresMinutes = this.configService.get<number>('OTP_EXPIRES_MINUTES') ?? 10;

        const expiresAt = new Date(Date.now() + otpExpiresMinutes * 60 * 1000);

        await this.otpModel.create({
            memberId: member._id,
            verificationId,
            codeHash,
            purpose: OtpPurpose.PasswordReset,
            expiresAt,
            used: false,
            attempts: 0,
            maxAttempts: 5,
        });

        await this.messagingService.publishNotification({
            type: NotificationEventType.PasswordResetOtpEmailRequested,
            payload: {
                email: member.email,
                fullName: member.fullName,
                code,
            },
        });

        return {
            verificationId,
            message: genericMessage,
        };
    }

    async verifyResetOtp(dto: VerifyResetOtpDto): Promise<{
        resetToken: string;
        message: string;
    }> {
        const otp = await this.otpModel
            .findOne({
                verificationId: dto.verificationId,
                purpose: OtpPurpose.PasswordReset,
            })
            .exec();

        if (!otp) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        if (otp.used) {
            throw new UnauthorizedException('OTP has already been used');
        }

        if (otp.expiresAt < new Date()) {
            throw new UnauthorizedException('OTP has expired');
        }

        if (otp.attempts >= otp.maxAttempts) {
            throw new UnauthorizedException('Maximum OTP attempts exceeded');
        }

        const isCodeValid = await bcrypt.compare(dto.code, otp.codeHash);

        if (!isCodeValid) {
            otp.attempts += 1;
            await otp.save();

            throw new UnauthorizedException('Invalid OTP code');
        }

        const member = await this.memberModel.findById(otp.memberId).exec();

        if (!member || !member.isActive || !member.emailVerified) {
            throw new UnauthorizedException('Invalid reset request');
        }

        otp.used = true;
        otp.usedAt = new Date();
        await otp.save();

        const payload: PasswordResetTokenPayload = {
            sub: member._id.toString(),
            email: member.email,
            type: 'password-reset',
        };

        const resetToken = await this.jwtService.signAsync(payload, {
            expiresIn: '10m',
        });

        return {
            resetToken,
            message: 'OTP verified. You may now reset your password.',
        };
    }

    async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
        let payload: PasswordResetTokenPayload;

        try {
            payload = await this.jwtService.verifyAsync<PasswordResetTokenPayload>(
                dto.resetToken,
            );
        } catch {
            throw new UnauthorizedException('Invalid or expired reset token');
        }

        if (payload.type !== 'password-reset') {
            throw new UnauthorizedException('Invalid reset token');
        }

        const member = await this.memberModel.findById(payload.sub).exec();

        if (!member) {
            throw new UnauthorizedException('Invalid reset token');
        }

        if (!member.isActive) {
            throw new UnauthorizedException('Inactive member account');
        }

        if (!member.emailVerified) {
            throw new UnauthorizedException('Member email is not verified');
        }

        if (!member.password) {
            throw new BadRequestException('Password has not been set for this account');
        }

        const isSamePassword = await bcrypt.compare(
            dto.newPassword,
            member.password,
        );

        if (isSamePassword) {
            throw new BadRequestException(
                'New password must be different from current password',
            );
        }

        const passwordHash = await bcrypt.hash(dto.newPassword, 10);

        member.password = passwordHash;
        await member.save();

        return {
            message: 'Password reset successfully',
        };
    }

    private async createAndSendOtp(member: MemberDocument): Promise<string> {
        await this.otpModel.updateMany(
            {
                memberId: member._id,
                purpose: OtpPurpose.EmailVerification,
                used: false,
            },
            {
                $set: {
                    used: true,
                    usedAt: new Date(),
                },
            },
        );

        const code = generateOtpCode();
        const codeHash = await bcrypt.hash(code, 10);

        const expiresInMinutes =
            this.configService.getOrThrow<number>('OTP_EXPIRES_MINUTES');

        const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

        const verificationId = randomUUID();

        await this.otpModel.create({
            memberId: member._id,
            verificationId,
            codeHash,
            purpose: OtpPurpose.EmailVerification,
            expiresAt,
            used: false,
            attempts: 0,
            maxAttempts: 3,
        });


        await this.messagingService.publishNotification({
            type: NotificationEventType.OtpEmailRequested,
            payload: {
                email: member.email,
                code,
            },
        });

        return verificationId;
    }

    private async generateUniqueReferralCode(fullName: string): Promise<string> {
        for (let attempt = 0; attempt < 5; attempt += 1) {
            const referralCode = generateReferralCode(fullName);

            const existingMember = await this.memberModel
                .findOne({ referralCode })
                .exec();

            if (!existingMember) {
                return referralCode;
            }
        }

        throw new BadRequestException('Could not generate referral code');
    }

    private async redisRateCheckLimit(
        target: string,
        ipAddress: string,
        action: AuthRateLimitAction,
        config: {
            stage1Limit: number;
            stage1Time: number;
            stage2Limit: number;
            stage2Time: number;
        },
    ): Promise<void> {
        const comboResult = await this.redisService.checkRateLimit({
            key: buildAuthComboRateLimitKey({
                action,
                target,
                ipAddress,
            }),
            maxAttempts: config.stage1Limit,
            windowSeconds: config.stage1Time,
        });

        if (!comboResult.allowed) {
            throwRateLimitException(`Too many requests. Please try again in ${comboResult.ttlSeconds} seconds.`);
        }

        const ipResult = await this.redisService.checkRateLimit({
            key: buildAuthIpRateLimitKey({
                action,
                ipAddress,
            }),
            maxAttempts: config.stage2Limit,
            windowSeconds: config.stage2Time,
        });

        if (!ipResult.allowed) {
            throwRateLimitException(`Too many attempts from this network. Please try again in ${ipResult.ttlSeconds} seconds.`);
        }
    }
}
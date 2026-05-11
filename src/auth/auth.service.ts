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
    ) { }

    async register(
        dto: RegisterDto,
        referralCode?: string,
    ): Promise<{ memberId: string; verificationId: string; message: string }> {
        const normalizedEmail = dto.email.toLowerCase();

        const existingMember = await this.memberModel
            .findOne({
                $or: [{ email: normalizedEmail }, { nationalId: dto.nationalId }],
            })
            .exec();

        const existingAdmin = await this.adminModel.findOne({ email: normalizedEmail }).exec();

        if (existingMember || existingAdmin) {
            throw new ConflictException('Email or national ID already exists');
        }

        const dateOfBirth = new Date(dto.dateOfBirth);

        if (!isAdult(dateOfBirth)) {
            throw new BadRequestException('Member must be at least 18 years old');
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
            referralCode,
            referredMemberId: member._id,
        });

        const verificationId = await this.createAndSendOtp(member);

        return {
            memberId: member._id.toString(),
            verificationId,
            message: 'Registration successful. Please verify your email OTP.',
        };
    }

    async verifyOtp(dto: VerifyOtpDto): Promise<{ message: string }> {
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


        return {
            message: 'Email verified successfully. You can now set your password.',
        };
    }

    async resendOtp(
        dto: ResendOtpDto,
    ): Promise<{ verificationId: string; message: string }> {
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
        const normalizedEmail = dto.email.toLowerCase();

        const member = await this.memberModel.findOne({ email: normalizedEmail }).exec();

        if (!member) {
            throw new BadRequestException('Member not found');
        }

        if (!member.emailVerified) {
            throw new ForbiddenException('Please verify your email before setting a password');
        }

        member.password = await bcrypt.hash(dto.password, 10);
        await member.save();

        return {
            message: 'Password set successfully. You can now login.',
        };
    }

    async login(dto: LoginDto): Promise<{ accessToken: string }> {
        const normalizedEmail = dto.email.toLowerCase();

        const member = await this.memberModel.findOne({ email: normalizedEmail }).exec();

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

        const payload: JwtPayload = {
            sub: member._id.toString(),
            email: member.email,
            type: 'member',
        };

        return {
            accessToken: await this.jwtService.signAsync(payload),
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

        await this.notificationsService.sendOtp(member.email, code);

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
}
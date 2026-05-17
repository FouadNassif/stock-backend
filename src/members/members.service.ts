import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Member, MemberDocument } from './schemas/member.schema';
import { checkMemberEligibility } from 'src/common/utils/member.util';
import { ConfigService } from '@nestjs/config';
import { ChangeMemberPasswordDto } from './dto/change-password.dto';

export type MemberProfileResponse = {
  id: string;
  fullName: string;
  email: string;
  nationalId: string;
  dateOfBirth: Date;
  emailVerified: boolean;
  identityStatus?: string;
  isActive: boolean;
  walletBalance: number;
  lastDepositAt?: Date;
  referralCode: string;
  referralLink: string;
  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class MembersService {
  constructor(
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,

    private readonly configService: ConfigService,
  ) {}

  async findByEmail(email: string): Promise<MemberDocument | null> {
    return this.memberModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(id: string): Promise<MemberDocument | null> {
    return this.memberModel.findById(id).exec();
  }

  async changePassword(
    currentMemberId: string,
    dto: ChangeMemberPasswordDto,
  ): Promise<{ message: string }> {
    const member = await this.memberModel.findById(currentMemberId).exec();

    const eligibleMember = checkMemberEligibility(member);

    if (!eligibleMember.emailVerified) {
      throw new UnauthorizedException('Member email is not verified');
    }

    if (!eligibleMember.password) {
      throw new BadRequestException(
        'Password has not been set for this account',
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      eligibleMember.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const isSamePassword = await bcrypt.compare(
      dto.newPassword,
      eligibleMember.password,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    eligibleMember.password = passwordHash;
    await eligibleMember.save({ validateModifiedOnly: true });

    return {
      message: 'Password changed successfully',
    };
  }

  async getMe(currentMemberId: string): Promise<MemberProfileResponse> {
    const member = await this.memberModel.findById(currentMemberId).exec();

    const eligibleMember = checkMemberEligibility(member);

    if (!eligibleMember.emailVerified) {
      throw new UnauthorizedException('Member email is not verified');
    }

    return this.toMemberProfileResponse(eligibleMember);
  }

  private toMemberProfileResponse(
    member: MemberDocument,
  ): MemberProfileResponse {
    const appUrl =
      this.configService.get<string>('APP_URL') ?? 'http://localhost:3000';

    return {
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
      referralLink: `${appUrl}/register?ref=${member.referralCode}`,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };
  }
}

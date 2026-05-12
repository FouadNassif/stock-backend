import { UnauthorizedException } from '@nestjs/common';

import { IdentityStatus, type MemberDocument } from '../../members/schemas/member.schema';

export function checkMemberEligibility(member: MemberDocument | null, checkStatus = false): MemberDocument {
    if (!member) {
        throw new UnauthorizedException('Member not found');
    }

    if (!member.isActive) {
        throw new UnauthorizedException('Inactive member account');
    }

    if ((member.identityStatus == IdentityStatus.Pending || member.identityStatus == IdentityStatus.Rejected) && checkStatus) {
        throw new UnauthorizedException('Account Identity Not verified');
    }

    return member;
}
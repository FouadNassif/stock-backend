import { UnauthorizedException } from '@nestjs/common';

import type { MemberDocument } from '../../members/schemas/member.schema';

export function checkMemberEligibility(member: MemberDocument | null): MemberDocument {
    if (!member) {
        throw new UnauthorizedException('Member not found');
    }

    if (!member.isActive) {
        throw new UnauthorizedException('Inactive member account');
    }

    return member;
}
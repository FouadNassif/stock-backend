import { NegativeBalanceAlertDocument } from '../schemas/negative-balance-alert.schema';
import { NegativeBalanceAlertResponse } from '../types/negative-balance-alert-response.type';

export function toNegativeBalanceAlertResponse(
    alert: NegativeBalanceAlertDocument,
): NegativeBalanceAlertResponse {
    return {
        id: alert._id.toString(),
        members: alert.members.map((member) => ({
            memberId: member.memberId.toString(),
            fullName: member.fullName,
            email: member.email,
            walletBalance: member.walletBalance,
        })),
        totalCount: alert.totalCount,
        checkedAt: alert.checkedAt,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt,
    };
}
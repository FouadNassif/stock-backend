import { StalePendingWithdrawalAlertDocument } from '../schemas/stale-pending-withdrawal-alert.schema';
import { StalePendingWithdrawalAlertResponse } from '../types/stale-pending-withdrawal-alert-response.type';

export function toStalePendingWithdrawalAlertResponse(
    alert: StalePendingWithdrawalAlertDocument,
): StalePendingWithdrawalAlertResponse {
    return {
        id: alert._id.toString(),
        withdrawals: alert.withdrawals.map((withdrawal) => ({
            transactionId: withdrawal.transactionId.toString(),
            memberId: withdrawal.memberId.toString(),
            memberFullName: withdrawal.memberFullName,
            memberEmail: withdrawal.memberEmail,
            amount: withdrawal.amount,
            status: withdrawal.status,
            requestedAt: withdrawal.requestedAt,
            ageHours: withdrawal.ageHours,
        })),
        totalCount: alert.totalCount,
        thresholdHours: alert.thresholdHours,
        checkedAt: alert.checkedAt,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt,
    };
}
export type StalePendingWithdrawalResponse = {
    transactionId: string;
    memberId: string;
    memberFullName: string;
    memberEmail: string;
    amount: number;
    status: string;
    requestedAt: Date;
    ageHours: number;
};

export type StalePendingWithdrawalAlertResponse = {
    id: string;
    withdrawals: StalePendingWithdrawalResponse[];
    totalCount: number;
    thresholdHours: number;
    checkedAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
};
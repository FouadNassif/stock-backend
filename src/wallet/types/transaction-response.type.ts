import { TransactionStatus, TransactionType } from "./transaction.type";

export type TransactionResponse = {
    id: string;
    type: TransactionType;
    amount: number;
    status: TransactionStatus;
    referenceId: string;
    notes?: string;
    balanceBefore: number;
    balanceAfter: number;
    processedAt?: Date;
    rejectedReason?: string;
    createdAt?: Date;
    updatedAt?: Date;
};

export type WithdrawalFilter = {
    type: TransactionType.Withdrawal;
    status?: TransactionStatus;
    createdAt?: {
        $gte?: Date;
        $lte?: Date;
    };
};
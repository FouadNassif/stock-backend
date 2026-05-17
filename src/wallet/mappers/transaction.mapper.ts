import { TransactionDocument } from '../schemas/transaction.schema';
import { TransactionResponse } from '../types/transaction-response.type';

export function toTransactionResponse(
    transaction: TransactionDocument,
): TransactionResponse {
    return {
        id: transaction._id.toString(),
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        referenceId: transaction.referenceId,
        notes: transaction.notes,
        balanceBefore: transaction.balanceBefore,
        balanceAfter: transaction.balanceAfter,
        processedAt: transaction.processedAt,
        rejectedReason: transaction.rejectedReason,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
    };
}
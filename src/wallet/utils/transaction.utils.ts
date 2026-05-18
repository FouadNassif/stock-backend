import { randomUUID } from 'crypto';
import { TransactionType } from '../types/transaction.type';

export function generateTransactionReference(type: TransactionType): string {
  return `${type.toUpperCase()}-${randomUUID()}`;
}

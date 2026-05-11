# Transaction Schema

## Collection

```txt
transactions
```

## Purpose

Stores wallet and trading financial events.

## Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| memberId | ObjectId | Yes | Owner member |
| type | enum | Yes | Transaction type |
| amount | number | Yes | Transaction amount |
| status | enum | Yes | Transaction status |
| referenceId | string | Yes | Unique reference or related order id |
| notes | string | No | Internal notes |
| balanceBefore | number | Yes | Wallet balance before transaction |
| balanceAfter | number | Yes | Wallet balance after transaction |
| processedAt | Date | No | When completed/reviewed |
| rejectedReason | string | No | Reason if rejected |
| createdAt | Date | Yes | Created by timestamps |
| updatedAt | Date | Yes | Updated by timestamps |

## Enums

type: deposit | withdrawal | buy | sell

status: pending | completed | rejected

## Indexes

memberId + createdAt, memberId + type, status, type, referenceId unique

## Example Document

```json
{"type":"buy","amount":500,"status":"completed","balanceBefore":1000,"balanceAfter":500}
```

## Design Notes

One shared transaction collection supports deposits, withdrawals, buy orders, and sell orders.

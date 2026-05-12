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
{
  "_id": "6a024b14692924cd79875ef0",
  "memberId": "6a02492e692924cd79875ee9",
  "type": "deposit",
  "amount": 550,
  "status": "completed",
  "referenceId": "DEPOSIT-a875ac2f-bba9-4e3b-8c6f-aa2c194b47e2",
  "notes": "Deposit simulated as successful payment",
  "balanceBefore": 0,
  "balanceAfter": 550,
  "createdAt":"2026-05-11T21:33:08.501Z",
  "updatedAt": "2026-05-11T21:33:08.525Z",
  "processedAt":"2026-05-11T21:33:08.525Z"
}
```

## Design Notes

One shared transaction collection supports deposits, withdrawals, buy orders, and sell orders.

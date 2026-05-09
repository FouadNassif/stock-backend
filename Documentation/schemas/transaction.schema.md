# Transaction Schema

## Collection

```txt
transactions
```

## Purpose

Stores wallet and future order financial events.

## Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| memberId | ObjectId | Yes | Owner member |
| type | enum | Yes | Transaction type |
| amount | number | Yes | Amount |
| status | enum | Yes | Status |
| referenceId | string | Yes | Unique reference |
| notes | string | No | Notes |
| balanceBefore | number | Yes | Wallet balance before |
| balanceAfter | number | Yes | Wallet balance after |
| processedAt | Date | No | Completion/review time |
| rejectedReason | string | No | Reason if rejected |

## Enums

type: deposit | withdrawal | buy | sell

status: pending | completed | rejected

## Indexes

memberId + createdAt, memberId + type, status, type, referenceId unique

## Example Document

```json
{"type":"deposit","amount":1000,"status":"completed"}
```

## Design Notes

One shared transaction collection supports deposits, withdrawals, buy orders, and sell orders.

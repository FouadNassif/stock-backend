# Order Schema

## Collection

```txt
orders
```

## Purpose

Stores historical buy/sell order execution records.

## Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| memberId | ObjectId | Yes | Member who placed order |
| stockId | ObjectId | Yes | Traded stock |
| positionId | ObjectId | Yes | Related position |
| type | enum | Yes | Order type |
| quantity | number | Yes | Shares bought or sold |
| priceAtExecution | number | Yes | Stock price at execution time |
| totalAmount | number | Yes | Executed total amount |
| status | enum | Yes | Order status |
| realizedProfitLoss | number | Yes | Profit/loss for sell orders, zero for buy |
| createdAt | Date | Yes | Created by timestamps |
| updatedAt | Date | Yes | Updated by timestamps |

## Enums

type: buy | sell

status: completed | rejected

## Indexes

memberId + createdAt, memberId + type, stockId, status

## Example Document

```json
{
  "_id": ObjectId("6a024b3c692924cd79875ef2"),
  "memberId":"6a02492e692924cd79875ee9",
  "stockId": "6a024b09692924cd79875eee",
  "positionId":"6a024b3c692924cd79875ef1",
  "type": "buy",
  "quantity": 2,
  "priceAtExecution": 182.5,
  "totalAmount": 365,
  "status": "completed",
  "realizedProfitLoss": 0,
  "createdAt":"2026-05-11T21:33:48.959Z",
  "updatedAt":"2026-05-11T21:33:48.959Z",
}
```

## Design Notes

Orders store execution snapshots. totalAmount and realizedProfitLoss are stored as historical facts.

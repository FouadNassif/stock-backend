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
{"type":"buy","quantity":5,"priceAtExecution":100,"totalAmount":500,"status":"completed","realizedProfitLoss":0}
```

## Design Notes

Orders store execution snapshots. totalAmount and realizedProfitLoss are stored as historical facts.

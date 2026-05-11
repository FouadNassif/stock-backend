# Orders Documentation

## Purpose

The Orders module handles stock trading actions and portfolio management for members.

## Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/orders/buy` | Buy stock |
| POST | `/api/orders/sell` | Sell stock |
| GET | `/api/orders/portfolio` | View portfolio |
| GET | `/api/orders/history` | View order history |

## Authentication

```txt
Authorization: Bearer {{member_token}}
```

## Buy Stock Body

```json
{
  "stockId": "stock_id",
  "quantity": 2
}
```

## Sell Stock Body

```json
{
  "stockId": "stock_id",
  "quantity": 1
}
```

## Order History Filters

```txt
GET /api/orders/history?type=buy
GET /api/orders/history?type=sell
GET /api/orders/history?status=completed
GET /api/orders/history?from=2026-05-01&to=2026-05-10
GET /api/orders/history?page=1&limit=10
```

## Buy Flow

1. Validate logged-in member.
2. Validate stock exists.
3. Check stock is listed.
4. Calculate `totalAmount = currentPrice * quantity`.
5. Check wallet balance is enough.
6. Deduct wallet balance.
7. Create or update open position.
8. Recalculate average purchase price if position already exists.
9. Create completed buy order.
10. Create completed buy transaction.
11. Send trade confirmation email.

## Sell Flow

1. Validate logged-in member.
2. Validate stock exists.
3. Find open position.
4. Check `sharesHeld >= quantity`.
5. Calculate proceeds using current stock price.
6. Calculate realized profit/loss.
7. Credit wallet balance.
8. Reduce position shares.
9. Close position if shares become zero.
10. Create completed sell order.
11. Create completed sell transaction.
12. Send trade confirmation email.

## Formulas

```txt
newAverage = (oldShares * oldAverage + newSharesBought * currentPrice) / (oldShares + newSharesBought)
realizedProfitLoss = (priceAtExecution - avgPurchasePrice) * quantitySold
investedValue = sharesHeld * avgPurchasePrice
currentValue = sharesHeld * stock.currentPrice
unrealizedProfitLoss = (stock.currentPrice - avgPurchasePrice) * sharesHeld
```

## Business Rules

- Buy is rejected if wallet balance is insufficient.
- Buy is rejected if stock is delisted.
- Sell is rejected if member has no open position.
- Sell is rejected if member sells more shares than held.
- Buy/sell creates both an order record and a transaction record.
- `priceAtExecution` is stored as a historical snapshot.
- `totalAmount` is stored as the executed financial amount.
- `realizedProfitLoss` is stored for sell orders.
- Portfolio unrealized P&L is calculated live using current stock price.
- Buy/sell operations use MongoDB transaction/session to avoid partial writes.

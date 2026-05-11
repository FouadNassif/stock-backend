# Stocks Documentation

## Purpose

The Stocks module manages the stock catalogue and stock price history.

## Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/stocks` | Create stock |
| GET | `/api/stocks` | List stocks |
| GET | `/api/stocks/:id` | Get stock by ID |
| GET | `/api/stocks/:id/history` | Get stock price history |
| PATCH | `/api/stocks/:id` | Update stock |
| PATCH | `/api/stocks/:id/delist` | Delist stock |

## Create Stock Body

```json
{
  "ticker": "AAPL",
  "companyName": "Apple Inc.",
  "sector": "Technology",
  "currentPrice": 182.5,
  "description": "Apple Inc. designs and sells consumer electronics, software, and services."
}
```

## Filters

```txt
GET /api/stocks?sector=Technology
GET /api/stocks?isListed=true
GET /api/stocks?search=apple
GET /api/stocks?page=1&limit=10
```

## Permissions

| Action | Access |
|---|---|
| Create/update/delist | Admin + Analyst |
| List/view/history | Logged-in admin or member |

## Business Rules

- Ticker is unique and stored uppercase.
- Creating a stock creates the first price history record.
- Updating `currentPrice` creates a new price history record.
- Delisting sets `isListed = false` instead of deleting.
- Buy orders cannot be placed for delisted stocks.

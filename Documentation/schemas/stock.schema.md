# Stock Schema

## Collection

```txt
stocks
```

## Purpose

Stores current stock catalogue information.

## Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| ticker | string | Yes | Unique uppercase ticker |
| companyName | string | Yes | Company name |
| sector | string | Yes | Sector |
| description | string | No | Company description |
| currentPrice | number | Yes | Current stock price |
| isListed | boolean | Yes | Listing status |
| createdAt | Date | Yes | Created by timestamps |
| updatedAt | Date | Yes | Updated by timestamps |

## Enums

No enum fields.

## Indexes

ticker unique, sector, isListed, companyName

## Example Document

```json
{
  "_id":"6a024b09692924cd79875eee",
  "ticker": "AAPL",
  "companyName": "Apple Inc.",
  "sector": "Technology",
  "description": "Apple Inc. designs and sells consumer electronics, software, and services.",
  "currentPrice": 12,
  "isListed": true,
  "createdAt": "2026-05-11T21:32:57.769Z",
  "updatedAt": "2026-05-11T21:38:22.963Z",
}
```

## Design Notes

Delisting sets isListed to false instead of deleting the stock. Current price is used by orders and portfolio.

# Price History Schema

## Collection

```txt
pricehistories
```

## Purpose

Stores stock price changes over time.

## Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| stockId | ObjectId | Yes | Related stock |
| price | number | Yes | Recorded price |
| recordedAt | Date | Yes | When price was recorded |
| createdAt | Date | Yes | Created by timestamps |
| updatedAt | Date | Yes | Updated by timestamps |

## Enums

No enum fields.

## Indexes

stockId + recordedAt

## Example Document

```json
{
  "_id": "6a024b09692924cd79875eef",
  "stockId": "6a024b09692924cd79875eee",
  "price": 182.5,
  "recordedAt": "2026-05-11T21:32:57.785Z",
  "createdAt": "2026-05-11T21:32:57.785Z",
  "updatedAt": "2026-05-11T21:32:57.785Z",
}
```

## Design Notes

Price history is created when a stock is created and whenever currentPrice changes.

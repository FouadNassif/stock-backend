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
{"stockId":"665f...","price":185.75,"recordedAt":"2026-05-09T00:00:00.000Z"}
```

## Design Notes

Price history is created when a stock is created and whenever currentPrice changes.

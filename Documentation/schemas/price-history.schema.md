# Price History Schema

## Collection

```txt
pricehistories
```

## Purpose

Stores stock price records over time.

## Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| stockId | ObjectId | Yes | Related stock |
| price | number | Yes | Recorded price |
| recordedAt | Date | Yes | Record time |

## Enums

No enum fields.

## Indexes

stockId + recordedAt

## Example Document

```json
{"stockId":"665f...","price":185.75}
```

## Design Notes

Created on stock creation and price update.

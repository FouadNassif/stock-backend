# Position Schema

## Collection

```txt
positions
```

## Purpose

Stores current and closed stock ownership positions for members.

## Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| memberId | ObjectId | Yes | Member owner |
| stockId | ObjectId | Yes | Stock held |
| sharesHeld | number | Yes | Current shares held |
| avgPurchasePrice | number | Yes | Weighted average purchase price |
| status | enum | Yes | Position status |
| openedAt | Date | Yes | When position was opened |
| closedAt | Date | No | When position was fully sold |
| createdAt | Date | Yes | Created by timestamps |
| updatedAt | Date | Yes | Updated by timestamps |

## Enums

status: open | closed

## Indexes

memberId + status, memberId + stockId + status, stockId

## Example Document

```json
{
  "_id": "6a024b3c692924cd79875ef1",
  "memberId":"6a02492e692924cd79875ee9",
  "stockId": "6a024b09692924cd79875eee",
  "sharesHeld": 0,
  "avgPurchasePrice": 182.5,
  "status": "closed",
  "openedAt": "2026-05-11T21:33:48.954Z",
  "createdAt": "2026-05-11T21:33:48.955Z",
  "updatedAt":"2026-05-11T21:38:47.930Z",
  "closedAt": "2026-05-11T21:38:47.930Z"
}
```

## Design Notes

A member has one open position per stock. Closing a position sets sharesHeld to zero and status to closed.

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
{"sharesHeld":5,"avgPurchasePrice":100,"status":"open"}
```

## Design Notes

A member has one open position per stock. Closing a position sets sharesHeld to zero and status to closed.

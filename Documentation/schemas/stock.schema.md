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
| description | string | No | Description |
| currentPrice | number | Yes | Current price |
| isListed | boolean | Yes | Listing status |

## Enums

No enum fields.

## Indexes

ticker unique, sector, isListed, companyName

## Example Document

```json
{"ticker":"AAPL","companyName":"Apple Inc.","sector":"Technology","currentPrice":182.5}
```

## Design Notes

Delisting sets isListed to false.

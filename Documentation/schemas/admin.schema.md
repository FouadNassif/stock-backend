# Admin Schema

## Collection

```txt
admins / adminusers
```

## Purpose

Stores internal platform users.

## Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| fullName | string | Yes | Admin full name |
| email | string | Yes | Unique login email |
| passwordHash | string | Yes | Hashed password |
| role | enum | Yes | Admin role |
| isActive | boolean | Yes | Active status |
| mustChangePassword | boolean | Yes | Temporary password flag |
| createdBy | ObjectId | No | Admin creator |
| lastLoginAt | Date | No | Last login time |

## Enums

role: admin | analyst | support

## Indexes

role, isActive, createdAt

## Example Document

```json
{"fullName":"Leila Analyst","email":"leila.analyst@example.com","role":"analyst"}
```

## Design Notes

Admin users are separate from members.

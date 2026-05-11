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
| password/passwordHash | string | Yes | Hashed password field depending on implementation |
| role | enum | Yes | Admin role |
| isActive | boolean | Yes | Account active status |
| mustChangePassword | boolean | Yes | Temporary password flag |
| createdBy | ObjectId | No | Admin who created this user |
| lastLoginAt | Date | No | Last login time |
| createdAt | Date | Yes | Created by timestamps |
| updatedAt | Date | Yes | Updated by timestamps |

## Enums

role: admin | analyst | support

## Indexes

email unique, role, isActive, createdAt

## Example Document

```json
{"fullName":"Leila Analyst","email":"leila.analyst@example.com","role":"analyst","mustChangePassword":true}
```

## Design Notes

Admin emails must also be unique against member emails. Admin users are separate from public members.

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
| password | string | Yes | Hashed password field depending on implementation |
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
{
  "_id": ObjectId("6a024a9a692924cd79875eed"),
  "fullName": "Leila",
  "email": "fouad.nassif@isae.edu.lb",
  "password": "Password Hassh",
  "role": "analyst",
  "isActive": true,
  "mustChangePassword": false,
  "createdBy": "6a0248bd692924cd79875ee8",
  "createdAt":"2026-05-11T21:31:06.659Z",
  "updatedAt": "2026-05-11T21:32:29.194Z",
  "lastLoginAt": "2026-05-11T21:32:29.194Z",
}
```

## Design Notes



- Admin emails must also be unique against member emails. 
- Admin users are separate from public members.

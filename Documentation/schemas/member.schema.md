# Member Schema

## Collection

```txt
members
```

## Purpose

Stores public investor/member accounts.

## Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| fullName | string | Yes | Member full name |
| email | string | Yes | Unique lowercase email |
| nationalId | string | Yes | Unique national ID |
| dateOfBirth | Date | Yes | Used for age validation |
| password | string | No | Hashed password after verification |
| emailVerified | boolean | Yes | Email verification status |
| identityStatus | enum | Yes | Identity/KYC status |
| isActive | boolean | Yes | Suspension status |
| walletBalance | number | Yes | Wallet balance |
| lastDepositAt | Date | No | Most recent deposit date |
| referralCode | string | Yes | Unique referral code |
| createdAt | Date | Yes | Created by timestamps |
| updatedAt | Date | Yes | Updated by timestamps |

## Enums

identityStatus: pending | approved | rejected

## Indexes

email unique, nationalId unique, referralCode unique, emailVerified, isActive, identityStatus

## Example Document

```json
{
  "_id": ObjectId("6a02492e692924cd79875ee9"),
  "fullName": "Fouad Nassif",
  "email": "a52fouad@gmail.com",
  "nationalId": "NAT-200527011298",
  "dateOfBirth": "2005-01-27T00:00:00.000Z",
  "emailVerified": true,
  "referralCode": "FOUA7136",
  "identityStatus": "pending",
  "isActive": true,
  "walletBalance": 717,
  "createdAt": "2026-05-11T21:25:02.126Z",
  "updatedAt": "2026-05-11T22:43:19.094Z",
  "password": "PasswordHash",
  "lastDepositAt": "2026-05-11T21:33:08.519Z",
}
```

## Design Notes

- Member emails must also be unique against admin emails.

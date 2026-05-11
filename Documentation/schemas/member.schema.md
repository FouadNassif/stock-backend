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
| passwordHash | string | No | Hashed password after verification |
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
{"fullName":"Adam Investor","email":"adam@example.com","walletBalance":1000,"emailVerified":true,"referralCode":"ADAM123456"}
```

## Design Notes

Member emails must also be unique against admin emails. Member passwords are stored as bcrypt hashes only.

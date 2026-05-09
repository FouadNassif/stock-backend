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
| passwordHash | string | No | Hashed password |
| emailVerified | boolean | Yes | OTP verification status |
| identityStatus | enum | Yes | KYC status |
| isActive | boolean | Yes | Suspension status |
| walletBalance | number | Yes | Wallet balance |
| lastDepositAt | Date | No | Used for 48-hour withdrawal rule |
| referralCode | string | Yes | Unique referral code |

## Enums

identityStatus: pending | approved | rejected

## Indexes

email unique, nationalId unique, referralCode unique

## Example Document

```json
{"fullName":"Adam Investor","email":"adam@example.com","walletBalance":1000}
```

## Design Notes

Members are separate from admin users.

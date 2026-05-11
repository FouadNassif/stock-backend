# OTP Schema

## Collection

```txt
otps
```

## Purpose

Stores OTP verification sessions for email verification and password reset.

## Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| memberId | ObjectId | Yes | Member who owns the OTP |
| verificationId | string | Yes | UUID verification session id |
| codeHash | string | Yes | bcrypt hash of OTP code |
| purpose | enum | Yes | OTP purpose |
| expiresAt | Date | Yes | Expiration date |
| used | boolean | Yes | Whether OTP was used |
| usedAt | Date | No | When OTP was used |
| attempts | number | Yes | Failed attempts count |
| maxAttempts | number | Yes | Maximum failed attempts |
| createdAt | Date | Yes | Created by timestamps |
| updatedAt | Date | Yes | Updated by timestamps |

## Enums

purpose: email_verification | password_reset

## Indexes

verificationId unique, memberId + purpose + used, expiresAt TTL

## Example Document

```json
{"verificationId":"uuid","purpose":"password_reset","used":false,"attempts":0,"maxAttempts":5}
```

## Design Notes

OTP code is never stored as plain text. Password reset OTPs are hashed, expire, have max attempts, and are single-use.

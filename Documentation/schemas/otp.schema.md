# OTP Schema

## Collection

```txt
otps
```

## Purpose

Stores OTP verification sessions.

## Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| memberId | ObjectId | Yes | Member owner |
| verificationId | string | Yes | Verification session UUID |
| codeHash | string | Yes | bcrypt hash of OTP |
| purpose | enum | Yes | OTP purpose |
| expiresAt | Date | Yes | Expiration time |
| used | boolean | Yes | Single-use status |
| attempts | number | Yes | Failed attempts |
| maxAttempts | number | Yes | Max allowed failed attempts |

## Enums

purpose: email_verification | password_reset

## Indexes

verificationId unique, expiresAt TTL

## Example Document

```json
{"verificationId":"uuid","purpose":"email_verification","used":false}
```

## Design Notes

OTP is never stored as plain text.

# Members Documentation

## Purpose

The Members module handles logged-in member profile/account actions.

## Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/members/me` | Get logged-in member profile |
| POST | `/api/members/change-password` | Change logged-in member password |

## Authentication

```txt
Authorization: Bearer {{member_token}}
```

## Get Me Response Fields

```txt
id
fullName
email
nationalId
dateOfBirth
emailVerified
identityStatus
isActive
walletBalance
lastDepositAt
referralCode
referralLink
createdAt
updatedAt
```

## Change Password Body

```json
{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@123",
  "confirmPassword": "NewPassword@123"
}
```

## Business Rules

- Member ID is taken from JWT token.
- Member cannot request another member's data.
- Member must be active.
- Email must be verified.
- Current password must be valid.
- New password must be different from the current password.
- `confirmPassword` must match `newPassword`.
- Password is hashed with bcrypt before saving.
- Password hash is never returned.

## Postman Folder

```txt
Members
```

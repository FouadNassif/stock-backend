# Member Authentication Documentation

## Purpose

The Auth module handles public member onboarding, login, OTP verification, referral registration, and password recovery.

## Features

- Register member
- Register with referral link
- Email OTP verification
- Resend OTP
- Set password after verification
- Login with JWT
- Forgot password
- Verify password reset OTP
- Reset password using short-lived reset token

## Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a member |
| POST | `/api/auth/register?ref=CODE` | Register with referral code |
| POST | `/api/auth/verify-otp` | Verify email OTP |
| POST | `/api/auth/resend-otp` | Resend OTP |
| POST | `/api/auth/set-password` | Set password after OTP verification |
| POST | `/api/auth/login` | Member login |
| POST | `/api/auth/forgot-password` | Request password reset OTP |
| POST | `/api/auth/verify-reset-otp` | Verify password reset OTP |
| POST | `/api/auth/reset-password` | Reset password using reset token |

## Request Bodies

### Register

```json
{
  "fullName": "Adam Investor",
  "email": "adam@example.com",
  "nationalId": "NAT-100001",
  "dateOfBirth": "1998-05-12"
}
```

### Verify OTP

```json
{
  "verificationId": "uuid-from-register-response",
  "code": "123456"
}
```

### Set Password

```json
{
  "email": "adam@example.com",
  "password": "Password@123"
}
```

### Login

```json
{
  "email": "adam@example.com",
  "password": "Password@123"
}
```

### Forgot Password

```json
{
  "email": "adam@example.com"
}
```

### Verify Reset OTP

```json
{
  "verificationId": "password-reset-verification-id",
  "code": "123456"
}
```

### Reset Password

```json
{
  "resetToken": "short-lived-reset-token",
  "newPassword": "NewPassword@123",
  "confirmPassword": "NewPassword@123"
}
```

## Business Rules

- Member must be at least 18 years old.
- Email must be unique across members and admins.
- National ID must be unique.
- OTP is stored hashed.
- OTP expires after configured duration.
- OTP is single-use and has max attempts.
- Member must verify email before setting password.
- Member must be active to login.
- Forgot password response is generic to prevent email enumeration.
- Password reset OTP uses `purpose = password_reset`.
- Reset token is short-lived.
- New password cannot be the same as the current password.

## Related Schemas

- Member
- OTP
- Referral

## Postman Folder

```txt
Member Auth
```

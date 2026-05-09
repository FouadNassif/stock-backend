# Member Authentication Documentation

## Purpose

The Auth module handles public member onboarding and login.

## Features

- Register member
- Register with referral link
- Email OTP verification
- Resend OTP
- Set password after verification
- Login with JWT

## Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a member |
| POST | `/api/auth/register?ref=CODE` | Register with referral code |
| POST | `/api/auth/verify-otp` | Verify email OTP |
| POST | `/api/auth/resend-otp` | Resend OTP |
| POST | `/api/auth/set-password` | Set password |
| POST | `/api/auth/login` | Member login |

## Register Body

```json
{
  "fullName": "Adam Investor",
  "email": "adam@example.com",
  "nationalId": "NAT-100001",
  "dateOfBirth": "1998-05-12"
}
```

## Verify OTP Body

```json
{
  "verificationId": "uuid-from-register-response",
  "code": "123456"
}
```

## Business Rules

- Member must be at least 18 years old.
- Email must be unique.
- National ID must be unique.
- OTP is stored hashed.
- OTP is single-use.
- Member must verify email before setting password.
- Referral code is passed as `?ref=CODE`.

## Related Schemas

- Member
- OTP
- Referral

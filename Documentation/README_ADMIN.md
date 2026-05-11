# Admin / Backoffice Documentation

## Purpose

The Admin module handles internal users such as Omar, Leila, and Support Agent.

## Roles

| Role | Purpose |
|---|---|
| admin | Full access |
| analyst | Stock catalogue and analytics access |
| support | Support workflows only where explicitly allowed |

## Seeded Admin

```txt
ADMIN_EMAIL=omar.admin@example.com
ADMIN_PASSWORD=Admin@123456
ADMIN_FULL_NAME=Omar Admin
```

## Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/admin/auth/login` | Admin login |
| POST | `/api/admin/auth/change-password` | Change own password |
| POST | `/api/admin/users` | Create admin/analyst/support user |
| GET | `/api/admin/users` | List admin users |
| GET | `/api/admin/withdrawals` | List withdrawal review queue |
| POST | `/api/admin/withdrawals/:id/approve` | Approve withdrawal |
| POST | `/api/admin/withdrawals/:id/reject` | Reject withdrawal |

## Request Bodies

### Admin Login

```json
{
  "email": "omar.admin@example.com",
  "password": "Admin@123456"
}
```

### Create Admin User

```json
{
  "fullName": "Leila Analyst",
  "email": "leila.analyst@example.com",
  "role": "analyst"
}
```

### Reject Withdrawal

```json
{
  "reason": "Bank account details are invalid"
}
```

## Business Rules

- Admin users do not self-register.
- New internal users receive a temporary password by email.
- New users start with `mustChangePassword = true`.
- Only admin can create and list internal users.
- Admin email cannot duplicate a member email.
- Withdrawal approval/rejection is admin-only.
- Approving a withdrawal deducts wallet balance and marks transaction completed.
- Rejecting a withdrawal does not change wallet balance.

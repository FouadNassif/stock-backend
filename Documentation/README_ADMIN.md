# Admin / Backoffice Documentation

## Purpose

The Admin module handles internal users such as Omar, Leila, and Support Agent.

## Roles

| Role | Purpose |
|---|---|
| admin | Full access |
| analyst | Stock catalogue and analytics access |
| support | Member and withdrawal support workflows |

## Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/admin/auth/login` | Admin login |
| POST | `/api/admin/auth/change-password` | Change own password |
| POST | `/api/admin/users` | Create admin/analyst/support user |
| GET | `/api/admin/users` | List admin users |

## Create Admin User Body

```json
{
  "fullName": "Leila Analyst",
  "email": "leila.analyst@example.com",
  "role": "analyst"
}
```

## Business Rules

- Omar admin is seeded automatically from `.env`.
- Admin users do not self-register.
- New internal users receive a temporary password by email.
- New users start with `mustChangePassword = true`.
- Only admin can create and list internal users.

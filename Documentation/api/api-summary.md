# API Summary

## 1. Overview

The main NestJS API base URL is:

```txt
http://localhost:3000/api
```

The FastAPI analytics service runs separately at:

```txt
http://localhost:8000
```

Most business routes are served by NestJS. FastAPI analytics routes are documented separately, but they are summarized here because NestJS analytics endpoints proxy to FastAPI through `ANALYTICS_SERVICE_URL`.

Authentication uses Member JWTs for member-facing features and Admin JWTs for CMS/admin features. Admin roles include `admin`, `analyst`, and `support`.

## 2. Authentication Types

| Auth Type | Used For |
| --- | --- |
| Public | Registration, login, OTP, public stock catalogue |
| Member JWT | Member profile, wallet, orders, portfolio, alerts |
| Admin JWT | CMS/admin routes |
| Admin role | Full administrative access |
| Analyst role | Stock/analytics access where allowed |
| Support role | Member support and withdrawal/system alert operations where allowed |

Exact role permissions are enforced by guards and `@AdminRoles(...)` decorators in the controllers. The admin role acts as a superuser in the role guard.

## 3. Member Authentication Routes

### POST /auth/register

Auth: Public

Purpose: Registers a member and creates an email verification OTP.

Body fields:

- `fullName`
- `email`
- `nationalId`
- `dateOfBirth`

Optional query:

- `ref`

Success:

- Returns `memberId`, `verificationId`, and a verification message.

### POST /auth/verify-otp

Auth: Public

Purpose: Verifies the registration email OTP.

Body fields:

- `verificationId`
- `code`

Success:

- Returns a success message and a short-lived `setupPasswordToken`.

### POST /auth/resend-otp

Auth: Public

Purpose: Invalidates the previous email verification OTP and sends a new OTP.

Body fields:

- `verificationId`

Success:

- Returns the new `verificationId` and a message.

### POST /auth/set-password

Auth: Public with valid setup token

Purpose: Sets a member password after OTP verification.

Body fields:

- `setupPasswordToken`
- `password`
- `confirmPassword`

Success:

- Returns a password-set success message.

### POST /auth/login

Auth: Public

Purpose: Logs in a verified active member.

Body fields:

- `email`
- `password`

Success:

- Returns a member `accessToken`.

### POST /auth/forgot-password

Auth: Public

Purpose: Starts a password reset flow and sends a password reset OTP when the account is eligible.

Body fields:

- `email`

Success:

- Returns a generic message and, for eligible existing accounts, a `verificationId`.

### POST /auth/verify-reset-otp

Auth: Public

Purpose: Verifies the password reset OTP.

Body fields:

- `verificationId`
- `code`

Success:

- Returns a short-lived `resetToken`.

### POST /auth/reset-password

Auth: Public with valid reset token

Purpose: Resets the member password.

Body fields:

- `resetToken`
- `newPassword`
- `confirmPassword`

Success:

- Returns a password-reset success message.

## 4. Member Routes

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/members/me` | Member JWT | Returns the current member profile and referral link. |
| POST | `/members/change-password` | Member JWT | Changes the current member password. |

`POST /members/change-password` body fields: `currentPassword`, `newPassword`, `confirmPassword`.

## 5. Admin Authentication and CMS User Routes

Admin user roles are `admin`, `analyst`, and `support`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/admin/auth/login` | Public | Logs in an active admin/CMS user. |
| POST | `/admin/auth/change-password` | Admin JWT | Changes the current admin password. |
| POST | `/admin/users` | Admin JWT + admin role | Creates an admin, analyst, or support user. |
| GET | `/admin/users` | Admin JWT + admin role | Lists CMS users with filters and pagination. |

Important fields:

- Admin login: `email`, `password`.
- Change password: `currentPassword`, `newPassword`.
- Create admin user: `fullName`, `email`, `role`.
- List admin users query: `role`, `isActive`, `search`, `page`, `limit`.

## 6. Admin Member Management Routes

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/members` | Admin JWT + admin/support | Lists members with filters and pagination. |
| GET | `/admin/members/:id` | Admin JWT + admin/support | Returns one member profile for CMS review. |
| GET | `/admin/members/:id/transactions` | Admin JWT + admin/support | Lists a member's transactions. |
| GET | `/admin/members/:id/orders` | Admin JWT + admin/support | Lists a member's orders. |
| POST | `/admin/members/:id/identity/approve` | Admin JWT + admin role | Approves member identity. |
| POST | `/admin/members/:id/identity/reject` | Admin JWT + admin role | Rejects member identity with a reason. |
| POST | `/admin/members/:id/status/activate` | Admin JWT + admin role | Reactivates a suspended member. |
| POST | `/admin/members/:id/status/suspend` | Admin JWT + admin role | Suspends an active member. |
| POST | `/admin/members/:id/wallet-adjustments` | Admin JWT + admin role | Manually credits or debits a member wallet. |

Useful fields and filters:

- Member list query: `identityStatus`, `isActive`, `emailVerified`, `search`, `page`, `limit`.
- Reject identity/status body: `reason`.
- Wallet adjustment body: `type` (`credit` or `debit`), `amount`, `reason`.

## 7. Stock Routes

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/stocks` | Public | Lists stocks with filters and pagination. |
| GET | `/stocks/:ticker` | Public | Returns one stock by ticker. |
| GET | `/stocks/:ticker/history` | Public | Returns stock details and price history. |
| POST | `/stocks/create` | Admin JWT + admin/analyst | Creates a listed stock and initial price history record. |
| PATCH | `/stocks/:id/update` | Admin JWT + admin/analyst | Updates stock metadata or current price. |
| PATCH | `/stocks/:id/listed` | Admin JWT + admin/analyst | Marks a delisted stock as listed. |
| PATCH | `/stocks/:id/delist` | Admin JWT + admin/analyst | Marks a listed stock as delisted. |

Common query/body fields:

- List stocks query: `sector`, `isListed`, `search`, `page`, `limit`, `clear`.
- Create stock body: `ticker`, `companyName`, `sector`, `currentPrice`, optional `description`.
- Update stock body: `companyName`, `sector`, `currentPrice`, `description`.

Cached stock routes include `cache.source` in the response where implemented. `clear=1` or `clear=true` can force cache refresh on implemented cached routes.

When `PATCH /stocks/:id/update` changes `currentPrice`, the stock service saves the new price, creates a price history record, and publishes a RabbitMQ `stock.price.updated` event. Price alert checking happens asynchronously after the stock update response returns, so the admin/analyst request does not wait for all matching alerts and emails to finish.

## 8. Wallet and Payment Routes

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/wallet/deposit` | Member JWT | Creates a Stripe checkout session and pending deposit transaction. |
| POST | `/wallet/withdraw` | Member JWT | Creates a pending withdrawal request for CMS review. |
| GET | `/wallet/balance` | Member JWT | Returns wallet balance and withdrawal availability. |
| GET | `/wallet/transactions` | Member JWT | Lists the current member's wallet transactions. |
| POST | `/payments/stripe/webhook` | Stripe signed webhook | Confirms Stripe checkout payments and completes deposits. |

Important fields:

- Deposit body: `amount`.
- Withdraw body: `amount`.
- Transaction query: `type`, `status`, `from`, `to`, `page`, `limit`.
- Stripe webhook requires `stripe-signature` and the raw request body.

## 9. Withdrawal Review Routes

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/withdrawals` | Admin JWT + admin/support | Lists withdrawal requests, defaulting to pending withdrawals. |
| POST | `/admin/withdrawals/:id/approve` | Admin JWT + admin/support | Approves a pending withdrawal and deducts wallet balance. |
| POST | `/admin/withdrawals/:id/reject` | Admin JWT + admin/support | Rejects a pending withdrawal without deducting wallet balance. |

Reject withdrawal body field: `reason`.

Approving or rejecting changes the withdrawal transaction status.

## 10. Orders and Portfolio Routes

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/orders/buy` | Member JWT | Buys shares of a listed stock. |
| POST | `/orders/sell` | Member JWT | Sells shares from an open position. |
| GET | `/orders/portfolio` | Member JWT | Returns current open positions and portfolio summary. |
| GET | `/orders/history` | Member JWT | Lists the current member's order history. |

Important fields:

- Buy body: `stockId`, `quantity`.
- Sell body: `stockId`, `quantity`.
- Order history query: `type`, `status`, `from`, `to`, `page`, `limit`.

Buy/sell requires an eligible member. Buy creates an order, transaction, position update, and wallet update. Sell updates the position and wallet. The portfolio route is cached per member, portfolio cache is evicted after buy/sell, and `clear=1` or `clear=true` can refresh portfolio cache.

## 11. Price Alert Routes

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/alerts` | Member JWT | Creates a member-specific price alert. |
| GET | `/alerts` | Member JWT | Lists the current member's price alerts. |
| DELETE | `/alerts/:id` | Member JWT | Deletes one of the current member's alerts. |

Important fields:

- Create alert body: `stockId`, `targetPrice`, `direction`.
- `direction` can be `above` or `below`.
- List alerts query: `stockId`, `direction`, `triggered`, `page`, `limit`.

Behavior and limits:

- `POST /alerts` creates a member price alert for a listed stock.
- `GET /alerts` lists the authenticated member's own alerts, including active and triggered alerts unless filtered by `triggered`.
- `DELETE /alerts/:id` deletes/cancels one of the authenticated member's alerts.
- Active alerts are alerts with `triggered: false`.
- Triggered alerts and deleted alerts do not count toward active alert limits.
- A member can have up to `MAX_ACTIVE_PRICE_ALERTS_PER_MEMBER` active alerts total. The documented default is `6`.
- A member can have up to `MAX_ACTIVE_PRICE_ALERTS_PER_STOCK` active alerts for the same stock. The documented default is `2`.
- The API also rejects duplicate active alerts with the same stock, target price, and direction.
- If a duplicate or limit rule is exceeded, the API returns a `400` validation/business error.
- Members do not manually trigger price alerts. Triggering happens after an admin or analyst updates a stock price and the new price satisfies the alert condition.
- Matching active alerts are marked triggered and publish `price_alert.triggered` notification events for email delivery.

## 12. Analytics Routes - NestJS Protected Proxy

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/analytics/volume` | Admin JWT + admin/analyst | Returns trading volume over time. |
| GET | `/analytics/stocks/top` | Admin JWT + admin/analyst | Returns top traded stocks. |
| GET | `/analytics/aum` | Admin JWT + admin/analyst | Returns assets under management. |
| GET | `/analytics/members/active` | Admin JWT + admin/analyst | Returns most active members. |
| GET | `/analytics/sectors` | Admin JWT + admin/analyst | Returns sector allocation. |
| GET | `/analytics/admin/summary` | Admin JWT + admin role | Returns admin summary analytics. |

Useful query fields:

- Volume: `stock_id`, `granularity`, `from`, `to`.
- Top stocks: `page`, `limit`.
- Active members: `days`, `limit`.

NestJS validates the admin token and role, then proxies requests to FastAPI using `ANALYTICS_SERVICE_URL`.

## 13. Analytics Routes - FastAPI Internal Service

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | Root health-style message. |
| GET | `/health` | Checks service and MongoDB connectivity. |
| GET | `/internal/analytics/volume` | Trading volume over time. |
| GET | `/internal/analytics/stocks/top` | Top traded stocks. |
| GET | `/internal/analytics/aum` | Assets under management. |
| GET | `/internal/analytics/members/active` | Most active members. |
| GET | `/internal/analytics/sectors` | Sector allocation. |
| GET | `/internal/analytics/admin/summary` | Admin summary analytics. |

FastAPI reads MongoDB directly and must use the same database as NestJS. These routes are intended for internal service communication and documentation.

## 14. System Alerts and Scheduled Job Routes

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/alerts/negative-balances` | Admin JWT + admin role | Returns the latest negative-balance snapshot. |
| POST | `/admin/alerts/negative-balances/run` | Admin JWT + admin role | Runs the negative-balance check manually. |
| GET | `/admin/alerts/stale-pending-withdrawals` | Admin JWT + support role | Returns the latest stale pending withdrawal snapshot. |
| POST | `/admin/alerts/stale-pending-withdrawals/run` | Admin JWT + support role | Runs the stale pending withdrawal check manually. |

Scheduled jobs refresh alert snapshots. Manual run routes are useful for testing and CMS operations. Negative balance alerts identify data integrity issues. Stale pending withdrawals identify pending withdrawals older than the system threshold.

Because the admin role is a superuser, admin users can pass role checks even on routes marked for support.

## 15. Audit Log Routes

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/audit-logs` | Admin JWT + admin role | Lists audit logs for admin/system/member actions. |

Supported query fields include `actorType`, `actorId`, `action`, `targetType`, `targetId`, `from`, `to`, `search`, `page`, and `limit`.

## 16. Response and Error Format

Successful NestJS responses are wrapped by a global response interceptor:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request completed successfully",
  "data": {},
  "timestamp": "2026-05-17T00:00:00.000Z",
  "path": "/api/example"
}
```

If a controller returns its own `message`, that message is used in the wrapper.

Common errors:

- `400` validation errors or bad request.
- `401` missing or invalid token.
- `403` forbidden role.
- `404` resource not found.
- `409` duplicate/conflict.
- `429` rate limit.
- `502` analytics service returned an error response.
- `503` analytics service is unavailable.

## 17. Postman Collection

Full request/response examples and exported collections should be kept in:

```txt
Documentation/postman/
```

This API summary is only a readable route overview, not the full Postman collection.

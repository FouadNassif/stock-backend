# System Overview

## 1. Project Summary

The Stock Market Platform is a backend system for member onboarding, wallet funding, stock trading, portfolio tracking, admin/CMS workflows, analytics, alerts, and realtime updates.

The platform is built with:

- NestJS as the main API service.
- MongoDB with Mongoose for persistence.
- Redis for caching and auth rate limiting support.
- RabbitMQ for notification and realtime event messaging.
- FastAPI as a standalone analytics service.
- Stripe for deposit checkout and webhook payment confirmation.
- Docker Compose for local infrastructure.

The NestJS API uses the global prefix:

```txt
/api
```

So local API routes are served under:

```txt
http://localhost:3000/api
```

## 2. High-Level Architecture

```txt
Client / Postman / Frontend
        |
        v
NestJS API Service
        |
        |-- MongoDB
        |-- Redis
        |-- RabbitMQ
        |-- Stripe
        |
        v
FastAPI Analytics Service
        |
        v
MongoDB
```

- Normal business operations go through the NestJS API.
- Analytics routes in NestJS are protected by admin JWT and role guards, then proxied to the FastAPI service.
- FastAPI reads MongoDB directly and uses aggregation pipelines for analytics queries.
- Redis supports stock and portfolio caching, plus auth/OTP rate limiting.
- RabbitMQ carries notification and realtime events.
- Scheduled jobs create MongoDB snapshots for system alerts.

## 3. NestJS Main API

### Auth / OTP / Password Setup / Reset

- Handles member registration, optional referral-code registration, email OTP verification, password setup, login, forgot password, reset OTP verification, and password reset.
- Stores OTP codes as hashes, tracks expiration, attempts, purpose, and single-use status.
- Uses Redis-backed rate limits for registration, login, forgot password, OTP verification, and OTP resend flows.
- Publishes email events through RabbitMQ instead of sending all emails directly inside the request flow.

### Members

- Provides authenticated member profile access through `GET /api/members/me`.
- Supports member password changes.
- Builds member referral links using `APP_URL`.
- Uses member eligibility checks to block inactive accounts and, on trading/wallet-sensitive flows, unapproved identities.

### Admin / CMS

- Supports admin login, admin password changes, internal admin/analyst/support user creation, and internal user listing.
- Bootstraps a default admin from environment variables on module startup if one does not already exist.
- Supports member listing, member details, member transactions, member orders, identity approval/rejection, activation/suspension, and manual wallet adjustments.
- Uses roles `admin`, `analyst`, and `support`; the role guard treats `admin` as a superuser.

### Stocks

- Manages stock creation, listing, detail lookup by ticker, price history, updates, listing, and delisting.
- Admin and analyst users can create/update/list/delist stocks.
- Creating a stock creates an initial price history record.
- Updating `currentPrice` creates a new price history record and checks matching price alerts.

### Wallet / Payments / Withdrawals

- Member deposits create Stripe checkout sessions and pending deposit transactions.
- Stripe webhook confirmation validates the `stripe-signature` header and raw body before completing the deposit.
- Completed deposit webhooks update wallet balance, set `lastDepositAt`, complete the transaction, and publish a wallet-credit email event.
- Withdrawal requests stay pending until admin/support approval or rejection; approval deducts balance, rejection does not.

### Orders / Portfolio

- Buy and sell flows run inside MongoDB sessions/transactions.
- Buy checks stock existence, listing status, member eligibility, and wallet balance before creating/updating positions.
- Sell checks open position ownership and share quantity before crediting wallet balance.
- Both buy and sell create completed order and transaction records, evict portfolio cache, and publish notification/realtime events.

### Price Alerts

- Members can create, list, and delete price alerts for listed stocks.
- Alerts support `above` and `below` target-price directions.
- Stock price updates call the alert checker and mark matching active alerts as triggered.
- Triggered alerts publish notification events for email delivery.

### Analytics Proxy

- NestJS exposes protected analytics routes under `/api/analytics`.
- Admin and analyst roles can access most analytics routes.
- `/api/analytics/admin/summary` is admin-only.
- The NestJS analytics service forwards requests to FastAPI using `ANALYTICS_SERVICE_URL`.

### System Alerts / Scheduled Jobs

- Scheduled jobs run with `@nestjs/schedule`.
- Negative balance checks run daily at midnight.
- Stale pending withdrawal checks run daily at 9 AM.
- Manual run endpoints also exist under `/api/admin/alerts`.
- Results are stored as MongoDB snapshots and read by admin/support CMS routes.

### Audit Logs

- Audit logs are stored in MongoDB through a global audit module.
- Logged actions include admin creation, identity decisions, member suspension/reinstatement, wallet adjustment, withdrawal approval/rejection, and stock changes.
- Admin-only routes can list audit logs with filters.

### Notifications / Messaging

- RabbitMQ clients publish notification and realtime events.
- Notification consumers send emails with Nodemailer.
- Email events include OTP, password reset OTP, new admin, wallet credit, withdrawals, trade confirmations, identity decisions, suspension, and price alerts.
- Realtime consumers forward portfolio update events to the WebSocket gateway.

### Redis Cache

- Redis is exposed through a global Redis module using `ioredis`.
- Stock list/detail responses and member portfolio summaries use Redis caching with source metadata.
- Auth and OTP flows use Redis counters for rate limiting.
- TTL values are configured through environment variables.

## 4. FastAPI Analytics Service

The analytics service is a separate FastAPI application in `analytics-service/`. It is built and started by Docker Compose as `analytics-service`.

- It exposes internal analytics routes under `/internal/analytics`.
- NestJS calls it through `ANALYTICS_SERVICE_URL`.
- It must connect to the same MongoDB database as NestJS, or analytics can return empty results.
- It uses MongoDB aggregation pipelines for analytics calculations instead of loading all records into memory.

Analytics views include:

- Trading volume over time.
- Top traded stocks.
- Assets under management (AUM).
- Most active members.
- Sector allocation.
- Admin summary.

## 5. Data Flow Examples

### Member Registration Flow

1. Member registers through the NestJS auth route.
2. The API validates age, email uniqueness, national ID uniqueness, and optional referral code.
3. OTP is generated, hashed, stored, and emailed through a RabbitMQ notification event.
4. Member verifies OTP.
5. Member receives a short-lived password setup token and sets a password.
6. Member logs in and receives a member JWT.

### Deposit Flow

1. Member creates a deposit checkout request.
2. NestJS creates a pending deposit transaction.
3. Stripe checkout session is created and returned to the member.
4. Payment remains pending until Stripe sends the webhook.
5. Stripe webhook validates `stripe-signature` and the raw request body.
6. NestJS completes the transaction, updates wallet balance, updates `lastDepositAt`, and publishes a wallet-credit email event.

### Trade Flow

1. Member buys or sells stock.
2. Member eligibility and balance/position checks run.
3. Order is created.
4. Transaction is created.
5. Position is created, updated, or closed.
6. Wallet balance is updated.
7. Portfolio cache is evicted.
8. Realtime and notification events are published.

### Analytics Flow

1. Admin or analyst calls a NestJS analytics endpoint.
2. NestJS validates admin JWT and roles.
3. NestJS proxies the request to FastAPI.
4. FastAPI aggregates MongoDB data.
5. FastAPI returns the response to NestJS.
6. NestJS returns the response to the client.

### Scheduled Alert Flow

1. Cron job runs.
2. System checks negative balances or stale pending withdrawals.
3. Snapshot is stored in MongoDB.
4. Admin/support routes read the latest snapshot for CMS display.

## 6. Persistence Layer

MongoDB stores the main application state:

- Members
- Admin users
- OTPs
- Referrals
- Stocks
- Price histories
- Transactions
- Orders
- Positions
- Price alerts
- Audit logs
- Negative balance alert snapshots
- Stale pending withdrawal alert snapshots

Schemas and indexes are documented separately in:

```txt
Documentation/database/schemas-and-indexes.md
```

## 7. Caching Layer

Redis supports:

- Stock catalogue list caching.
- Stock detail caching.
- Portfolio summary caching per member.
- Auth and OTP rate limit counters.

Cache TTL values are configurable through environment variables:

```txt
CACHE_STOCKS_TTL_SECONDS
CACHE_PORTFOLIO_TTL_SECONDS
```

Cache invalidation behavior:

- Stock list/detail cache is invalidated after stock creation, update, delist, and price update.
- Portfolio cache is evicted after buy/sell trade execution.
- `?clear=1` or `?clear=true` can force refresh on implemented cached routes.
- A `stockCurrentPrice` cache key helper exists, but no dedicated current-price cached route was found. Treat current-price caching as partial / check implementation.
- Relisting stock saves the new listed status, but the current `listStock` implementation should be checked for cache invalidation consistency.

Detailed cache documentation is in:

```txt
Documentation/cache/redis-cache.md
```

## 8. Messaging / Realtime Layer

RabbitMQ is used to publish and consume notification/realtime events.

- Notification events support email delivery for OTPs, wallet updates, withdrawals, trades, admin provisioning, identity decisions, suspensions, and price alerts.
- Realtime events support portfolio update messages after trade execution.
- The WebSocket gateway authenticates member sockets with JWT and lets members join their portfolio room.
- Portfolio update events are emitted to the matching member room as `portfolio.updated`.

WebSocket notes are documented separately in:

```txt
Documentation/realtime/websocket-notes.md
```

## 9. Security and Access Control

- Member JWT protects member routes such as profile, wallet, orders, and price alerts.
- Admin JWT protects CMS/admin routes.
- Admin roles include `admin`, `analyst`, and `support`.
- The `admin` role acts as a superuser in the admin role guard.
- Guards and decorators enforce route access.
- Global `ValidationPipe` uses whitelist mode, transforms DTO input, and rejects unknown fields.
- Sensitive auth/OTP routes use Redis-backed rate limits.
- Passwords and OTPs are hashed before storage.
- JWT, SMTP, Stripe, RabbitMQ, Redis, and database secrets must stay in `.env` only.
- Stripe webhooks require raw body support and a valid `stripe-signature` header.

## 10. Local Development Infrastructure

Docker Compose defines these local services:

- MongoDB on `localhost:27017`.
- Mongo Express on `http://localhost:8081`.
- Redis on `localhost:6379`.
- RedisInsight on `http://localhost:5540`.
- RabbitMQ on `localhost:5672`.
- RabbitMQ Management UI on `http://localhost:15672`.
- FastAPI analytics service on `http://localhost:8000`.

Normal startup flow:

```bash
docker compose up -d
npm install
npm run start:dev
```

FastAPI health check:

```txt
GET http://localhost:8000/health
```

MongoDB runs with replica set support because order and payment flows use MongoDB sessions/transactions.

## 11. Important Notes / Assumptions

- FastAPI analytics returns empty data if it connects to a different MongoDB database than NestJS.
- Stripe webhook testing needs a valid `stripe-signature` header and raw request body.
- The negative-balance seed member exists only to test the negative-balance system alert.
- Redis must be running for cache and rate-limit behavior.
- RabbitMQ must be running for notification and realtime event flow.
- Referral creation is implemented, but the referral email-verified status update path should be checked before documenting referral rewards.
- Some existing older documentation may describe deposits as simulated; the current code uses Stripe checkout plus webhook confirmation.

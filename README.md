# Stock Market Platform

## Overview

Stock Market Platform is a backend application for a simulated stock trading platform.

It supports member onboarding, OTP email verification, referrals, admin/CMS users, stock catalogue management, wallet deposits, withdrawal requests, withdrawal CMS review, order execution, portfolio management, transaction history, password recovery, analytics, Redis caching, scheduled system alerts, RabbitMQ messaging, and realtime portfolio updates.

The main API is built with NestJS. Analytics are served through protected NestJS routes that proxy to a standalone FastAPI analytics service.

## Tech Stack

- NestJS
- TypeScript
- MongoDB
- Mongoose
- MongoDB sessions/transactions
- JWT / Passport
- bcrypt
- Nodemailer / SMTP
- Stripe
- Redis
- RedisInsight
- RabbitMQ
- Socket.IO
- FastAPI
- Python
- Docker Compose
- Mongo Express
- class-validator / class-transformer
- Joi environment validation
- ESLint
- Postman

## Completed Features

### Member Features

- Member registration
- OTP email verification
- Referral registration
- Member login
- Member profile endpoint
- Member change password
- Forgot password with OTP reset flow
- Wallet balance
- Wallet deposits through Stripe checkout
- Wallet withdrawal requests
- Transaction history
- Buy/sell stocks
- Portfolio summary
- Average purchase price calculation
- Realized and unrealized profit/loss
- Price alerts

### Admin / CMS Features

- Admin authentication
- Admin user provisioning
- Admin, analyst, and support roles
- Role-based admin access
- Member listing and filtering
- Member identity approval/rejection
- Member activation/suspension
- Manual wallet adjustments
- Withdrawal approval/rejection
- Stock create/update/list/delist
- Stock price history
- Audit logs
- System alert snapshots

### Analytics Features

- Trading volume over time
- Top traded stocks
- Platform assets under management
- Most active members
- Sector allocation
- Admin summary metrics

### Infrastructure Features

- MongoDB transactions using replica set
- Redis caching for stock and portfolio data
- Redis-based auth rate limiting
- RabbitMQ notification and realtime queues
- Socket.IO realtime portfolio updates
- Scheduled jobs for system alerts
- FastAPI analytics service using MongoDB aggregation pipelines
- Seed data for local testing
- Postman collection with saved examples

## API Base URLs

NestJS API:

```txt
http://localhost:3000/api
```

FastAPI analytics service:

```txt
http://localhost:8000
```

FastAPI Swagger docs:

```txt
http://localhost:8000/docs
```

## How to Run Locally

Follow these steps from a fresh clone.

### 1. Install dependencies

```bash
npm install
```

### 2. Create the environment file

Copy the environment template into the project root:

```bash
copy Documentation\env\.env.example .env
```

Then open `.env` and fill the required local values.

For local development with Docker MongoDB, use:

```env
MONGO_URI=mongodb://localhost:27017/stock_market_platform?replicaSet=rs0
REDIS_HOST=localhost
REDIS_PORT=6379
ANALYTICS_SERVICE_URL=http://localhost:8000
```

Important:

- Do not commit the real `.env` file.
- Replace placeholder secrets locally.
- `MAIL_FROM` should be an email address only.
- `MAIL_FROM_NAME` can be a display name such as `NoReply` or `Stock Market Platform`.

### 3. Start Docker services

```bash
docker compose up -d
```

Check that containers are running:

```bash
docker compose ps
```

Useful local service URLs:

```txt
NestJS API: http://localhost:3000/api
FastAPI Analytics: http://localhost:8000
FastAPI Docs: http://localhost:8000/docs
Mongo Express: http://localhost:8081
RedisInsight: http://localhost:5540
RabbitMQ Management: http://localhost:15672
```

### 4. Initialize MongoDB replica set

The app uses MongoDB sessions/transactions, so MongoDB must run as a replica set locally.

After Docker starts, run:

```bash
docker exec -it stock-market-mongodb mongosh
```

Inside `mongosh`, run:

```js
rs.initiate({
  _id: "rs0",
  members: [
    {
      _id: 0,
      host: "localhost:27017"
    }
  ]
})
```

Check status:

```js
rs.status()
```

Exit:

```js
exit
```

If the replica set is already initialized, `rs.initiate()` may return an “already initialized” message. In that case, continue normally.

### 5. Run database seed

```bash
npm run seed
```

The seed creates local testing data for admins, members, stocks, transactions, orders, positions, alerts, analytics, and system alert testing.

### 6. Start the NestJS API

```bash
npm run start:dev
```

The NestJS API should be available at:

```txt
http://localhost:3000/api
```

### 7. Check the FastAPI analytics service

The FastAPI analytics service is started through Docker Compose.

Check health:

```txt
GET http://localhost:8000/health
```

Open Swagger docs:

```txt
http://localhost:8000/docs
```

### 8. Start Stripe webhook forwarding

Stripe webhooks are required to complete the deposit flow locally.

Install and login to the Stripe CLI if needed, then run:

```bash
stripe listen --forward-to localhost:3000/api/payments/stripe/webhook
```

Stripe CLI will print a webhook signing secret like:

```txt
whsec_...
```

Copy that value into your `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_replace_with_value_from_stripe_cli
```

Then restart the NestJS app after changing `.env`:

```bash
npm run start:dev
```

When testing deposits:

1. Call the deposit endpoint from Postman.
2. Open the Stripe checkout URL returned by the API.
3. Complete payment using Stripe test card details.
4. Stripe CLI forwards the webhook to NestJS.
5. The webhook marks the deposit transaction as completed and updates the member wallet balance.

### 9. Run final checks

```bash
npm run lint
npm run build
```

Both commands should complete without errors.

## Environment

The real `.env` file is not committed.

Use the template:

```txt
Documentation/env/.env.example
```

The environment template includes variables for:

- Application port and URLs
- MongoDB
- JWT/auth
- OTP
- SMTP/email
- Redis
- Redis cache TTLs
- Rate limiting
- Stripe
- RabbitMQ
- FastAPI analytics service

Important MongoDB URI for local development:

```env
MONGO_URI=mongodb://localhost:27017/stock_market_platform?replicaSet=rs0
```

The application uses MongoDB sessions/transactions for order execution. Because of this, MongoDB must run as a replica set, even in local development.

## Docker Commands

Start services:

```bash
docker compose up -d
```

Stop services while keeping data:

```bash
docker compose down
```

Stop services and delete local volumes/data:

```bash
docker compose down -v
```

Use `docker compose down -v` only when you want to delete local MongoDB/Redis volume data.

## MongoDB

MongoDB is the main persistence database.

It stores:

- Members
- Admin users
- OTPs
- Referrals
- Stocks
- Price history
- Transactions
- Orders
- Positions
- Price alerts
- Audit logs
- Scheduled alert snapshots

Schema and index details are documented in:

```txt
Documentation/database/schemas-and-indexes.md
```

## Redis

Redis is used for caching and rate limiting.

Current usage includes:

- Stock catalogue/list cache
- Stock detail/current price cache
- Member portfolio cache
- Auth and OTP rate limiting

Redis cache TTLs are configurable through environment variables.

RedisInsight is available locally at:

```txt
http://localhost:5540
```

Detailed Redis documentation is available in:

```txt
Documentation/cache/redis-cache.md
```

## RabbitMQ and Realtime

RabbitMQ is used for notification and realtime event queues.

Socket.IO is used for realtime portfolio update messages.

Realtime portfolio events are published after successful buy/sell trade execution. Clients should treat realtime events as hints and refetch the portfolio through REST when they need the latest full data.

RabbitMQ management UI is available locally at:

```txt
http://localhost:15672
```

Detailed realtime documentation is available in:

```txt
Documentation/realtime/websocket-notes.md
```

## Stripe Deposit Flow

The deposit flow uses Stripe Checkout and Stripe webhooks.

Basic flow:

1. Member creates a deposit request.
2. API creates a Stripe checkout session.
3. Member completes payment on Stripe checkout.
4. Stripe webhook is forwarded to the NestJS webhook endpoint.
5. API verifies Stripe signature.
6. Deposit transaction is marked completed.
7. Member wallet balance is updated.

Local webhook endpoint:

```txt
POST /api/payments/stripe/webhook
```

Stripe CLI forwarding command:

```bash
stripe listen --forward-to localhost:3000/api/payments/stripe/webhook
```

## Main API Areas

### Member Auth

```txt
POST /api/auth/register
POST /api/auth/register?ref={referralCode}
POST /api/auth/verify-otp
POST /api/auth/resend-otp
POST /api/auth/set-password
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/verify-reset-otp
POST /api/auth/reset-password
```

### Members

```txt
GET  /api/members/me
POST /api/members/change-password
```

### Admin Auth

```txt
POST /api/admin/auth/login
POST /api/admin/auth/change-password
```

### Admin Users / Admin Members

```txt
POST /api/admin/users
GET  /api/admin/users

GET  /api/admin/members
GET  /api/admin/members/:id
GET  /api/admin/members/:id/transactions
GET  /api/admin/members/:id/orders

POST /api/admin/members/:id/identity/approve
POST /api/admin/members/:id/identity/reject
POST /api/admin/members/:id/status/activate
POST /api/admin/members/:id/status/suspend
POST /api/admin/members/:id/wallet-adjustments
```

### Stocks

```txt
GET   /api/stocks
GET   /api/stocks/:ticker
GET   /api/stocks/:ticker/history

POST  /api/stocks/create
PATCH /api/stocks/:id/update
PATCH /api/stocks/:id/listed
PATCH /api/stocks/:id/delist
```

### Wallet

```txt
POST /api/wallet/deposit
POST /api/wallet/withdraw
GET  /api/wallet/balance
GET  /api/wallet/transactions
```

### Admin Withdrawals

```txt
GET  /api/admin/withdrawals
POST /api/admin/withdrawals/:id/approve
POST /api/admin/withdrawals/:id/reject
```

### Orders

```txt
POST /api/orders/buy
POST /api/orders/sell
GET  /api/orders/portfolio
GET  /api/orders/history
```

### Price Alerts

```txt
POST   /api/alerts
GET    /api/alerts
DELETE /api/alerts/:id
```

### Analytics

NestJS protected analytics routes:

```txt
GET /api/analytics/volume
GET /api/analytics/stocks/top
GET /api/analytics/aum
GET /api/analytics/members/active
GET /api/analytics/sectors
GET /api/analytics/admin/summary
```

FastAPI internal analytics routes:

```txt
GET /internal/analytics/volume
GET /internal/analytics/stocks/top
GET /internal/analytics/aum
GET /internal/analytics/members/active
GET /internal/analytics/sectors
GET /internal/analytics/admin/summary
```

Analytics documentation is available in:

```txt
Documentation/analytics/fastapi-analytics-service.md
```

### System Alerts

```txt
GET  /api/admin/alerts/negative-balances
POST /api/admin/alerts/negative-balances/run

GET  /api/admin/alerts/stale-pending-withdrawals
POST /api/admin/alerts/stale-pending-withdrawals/run
```

Scheduled jobs documentation is available in:

```txt
Documentation/scheduler/scheduled-jobs.md
```

### Audit Logs

```txt
GET /api/admin/audit-logs
```

## Postman

The exported Postman files are stored in:

```txt
Documentation/postman/
```

Expected files:

```txt
Documentation/postman/Stock Market.postman_collection.json
Documentation/postman/Stock Market.postman_environment.json
```

Recommended Postman environment variables:

```txt
base_url=http://localhost:3000/api
analytics_url=http://localhost:8000
socketUrl=http://localhost:3000
ticker=AAPL
```

Tokens and sensitive values should not be committed with real values.

## Seed Data

Seed data is used for local testing and Postman examples.

Run:

```bash
npm run seed
```

Seed data documentation is available in:

```txt
Documentation/seed/seed-data.md
```

The seed supports testing:

- Admin login
- Analyst login
- Support login
- Member login
- Stocks
- Wallet flows
- Deposits and withdrawals
- Orders
- Portfolio
- Price alerts
- Analytics
- System alerts
- Audit logs

## Useful Commands

Install dependencies:

```bash
npm install
```

Start Docker services:

```bash
docker compose up -d
```

Start NestJS in development mode:

```bash
npm run start:dev
```

Run seed data:

```bash
npm run seed
```

Run lint:

```bash
npm run lint
```

Build project:

```bash
npm run build
```

Stop Docker services:

```bash
docker compose down
```


## Security Notes

- Passwords are hashed using bcrypt.
- OTP codes are hashed before being stored.
- OTP records support expiration, max attempts, and single-use behavior.
- Password reset uses OTP verification and a short-lived reset token.
- Forgot password responses are generic to prevent email enumeration.
- Login and OTP-related routes are rate-limited using Redis.
- Member IDs are taken from JWT tokens, not request bodies.
- Admin IDs are taken from JWT tokens, not request bodies.
- Admin routes are protected with admin JWT and role guards.
- Member emails cannot duplicate admin emails.
- Buy/sell order flows use MongoDB transactions for database consistency.
- Stripe webhook signatures are verified before processing payment events.
- Sensitive values such as password hashes, OTP hashes, JWT secrets, SMTP passwords, and Stripe secrets must never be committed.

## Documentation

Project documentation is stored in:

```txt
Documentation/
```

Important files:

```txt
Documentation/setup/setup-and-testing-guide.md
Documentation/architecture/system-overview.md
Documentation/api/api-summary.md
Documentation/database/schemas-and-indexes.md
Documentation/seed/seed-data.md
Documentation/env/.env.example
Documentation/analytics/fastapi-analytics-service.md
Documentation/cache/redis-cache.md
Documentation/scheduler/scheduled-jobs.md
Documentation/realtime/websocket-notes.md
Documentation/postman/
```

## Branching Strategy

Feature branches are created from `development`.

Examples:

```txt
feat/auth
feat/admin-auth
feat/stocks
feat/wallet
feat/orders
feat/alerts
fix/project-cleanup
fix/major-fixes
docs/project-documentation
```

## Commit Convention

Commits follow:

```txt
type(scope): description
```

Examples:

```txt
feat(auth): add otp verification
feat(admin): add admin user provisioning
feat(stocks): add stock catalogue and price history
feat(wallet): add deposits withdrawals and transaction history
feat(orders): add buy sell and portfolio management
feat(redis): add cache and auth rate limiting
feat(analytics): add FastAPI analytics service
feat(realtime): add portfolio update websocket events
fix(auth): prevent duplicate emails across members and admins
fix(stocks): invalidate cache after listing stock
docs(project): update final project documentation
docs(security): document Redis auth rate limiting
```

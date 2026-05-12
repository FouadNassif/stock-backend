# Stock Market Platform

## Overview

Stock Market Platform is a NestJS backend application for a simulated stock trading platform. It supports member onboarding, OTP email verification, referrals, admin/backoffice users, stock catalogue management, wallet deposits, withdrawal requests, withdrawal CMS review, order execution, portfolio management, transaction history, password recovery, and Redis-based auth rate limiting.

## Tech Stack

- NestJS
- TypeScript
- MongoDB
- Mongoose
- MongoDB sessions/transactions
- JWT / Passport
- bcrypt
- Nodemailer
- Docker Compose
- Mongo Express
- Redis
- RedisInsight
- class-validator / class-transformer
- Joi environment validation

## Completed Features

- Member authentication
- OTP email verification
- Referral registration
- Member profile endpoint
- Member change password
- Forgot password with OTP reset flow
- Cross-role email uniqueness between members and admins
- Admin authentication
- Admin user provisioning
- Role-based admin access
- Stock catalogue
- Stock price history
- Wallet deposits
- Wallet withdrawal requests
- Admin withdrawal approval/rejection
- Wallet balance
- Transaction history
- Orders: buy/sell stocks
- Portfolio management
- Average purchase price calculation
- Realized and unrealized profit/loss
- MongoDB transactions using replica set
- Redis-based auth rate limiting
- Login rate limiting using IP + email combo keys
- Forgot password rate limiting using IP + email combo keys

## API Base URL

```txt
http://localhost:3000/api
```

## Local Setup

```bash
npm install
docker compose up -d
npm run start:dev
```

Mongo Express:

```txt
http://localhost:8081
```

RedisInsight:

```txt
http://localhost:5540
```

## Environment

Create a `.env` file in the project root using:

```txt
Documentation/.env.example
```

Important MongoDB URI:

```env
MONGO_URI=mongodb://localhost:27017/stock_market_platform?replicaSet=rs0
```

Redis environment variables:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

The application uses MongoDB sessions/transactions for order execution. Because of this, MongoDB must run as a replica set, even in local development.

## MongoDB Replica Set Setup

The Docker MongoDB service should run with replica set enabled.

After starting Docker:

```bash
docker compose up -d
```

Initialize the replica set once:

```bash
docker exec -it stock-market-mongodb mongosh
```

Inside `mongosh`:

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

Then restart the NestJS server:

```bash
npm run start:dev
```

## Docker Commands

```bash
docker compose up -d
docker compose down
docker compose down -v
```

Use `docker compose down -v` only when you want to delete local MongoDB and Redis volume data.

## Redis

Redis is used for temporary security and performance data.

Current usage:

- Login rate limiting
- Forgot password rate limiting

Redis keys are temporary and expire automatically using TTL.

Example keys:

```txt
rate-limit:login:combo:<ip>:<email>
rate-limit:login:ip:<ip>
rate-limit:forgot-password:combo:<ip>:<email>
rate-limit:forgot-password:ip:<ip>
```

RedisInsight is available at:

```txt
http://localhost:5540
```

### Redis Rate Limiting Rules

Login:

```txt
5 attempts per IP + email combo per 15 minutes
20 attempts per IP per 15 minutes
```

Forgot password:

```txt
3 requests per IP + email combo per 15 minutes
10 requests per IP per 15 minutes
```

Why both IP and email are used:

```txt
IP + email combo protects a specific account from brute force attempts.
IP-only limit protects the system from one network spamming many emails.
```

Successful login clears only the login combo key for that IP + email. The IP key remains active to protect against mass abuse from one network.

## Main API Areas

### Member Auth

```txt
POST /api/auth/register
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

### Admin

```txt
POST /api/admin/auth/login
POST /api/admin/auth/change-password
POST /api/admin/users
GET  /api/admin/users
GET  /api/admin/withdrawals
POST /api/admin/withdrawals/:id/approve
POST /api/admin/withdrawals/:id/reject
```

### Stocks

```txt
POST  /api/stocks
GET   /api/stocks
GET   /api/stocks/:id
GET   /api/stocks/:id/history
PATCH /api/stocks/:id
PATCH /api/stocks/:id/delist
```

### Wallet

```txt
POST /api/wallet/deposit
POST /api/wallet/withdraw
GET  /api/wallet/balance
GET  /api/wallet/transactions
```

### Orders

```txt
POST /api/orders/buy
POST /api/orders/sell
GET  /api/orders/portfolio
GET  /api/orders/history
```

## Security Notes

- Passwords are hashed using bcrypt.
- OTP codes are hashed before being stored.
- OTP records support expiration, max attempts, and single-use behavior.
- Password reset uses OTP verification and a short-lived reset token.
- Forgot password responses are generic to prevent email enumeration.
- Login and forgot-password routes are rate-limited using Redis.
- Rate limiting uses IP + email combo keys and IP-only keys.
- Member IDs are taken from JWT tokens, not from request bodies.
- Admin IDs are taken from JWT tokens, not from request bodies.
- Admin routes are protected with admin JWT and role guards.
- Member emails cannot duplicate admin emails.
- Buy/sell order flows use MongoDB transactions for database consistency.
- Sensitive values such as password hashes and OTP hashes are never returned in API responses.

## Documentation

Project documentation is stored in:

```txt
Documentation/
```

The documentation includes:

```txt
Documentation/.env.example
Documentation/README_AUTH.md
Documentation/README_ADMIN.md
Documentation/README_MEMBERS.md
Documentation/README_STOCKS.md
Documentation/README_WALLET.md
Documentation/README_ORDERS.md
Documentation/README_SECURITY.md
Documentation/schemas/
Documentation/postman/
Documentation/seed-data/
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
feat(redis): add ip email auth rate limiting
fix(auth): prevent duplicate emails across members and admins
docs(project): update documentation for members auth and orders
docs(security): document redis auth rate limiting
```

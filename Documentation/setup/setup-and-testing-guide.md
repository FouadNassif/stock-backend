# Setup and Testing Guide

This guide explains how to run the Stock Market Platform locally, seed test data, and perform final checks before submission.

## Prerequisites

Install these tools before starting:

- Node.js and npm
- Docker Desktop
- Postman

The local Docker setup provides:

- MongoDB
- Mongo Express
- Redis
- RedisInsight
- RabbitMQ
- FastAPI analytics service

## Environment Setup

Create a project-root `.env` file before starting the NestJS app.

If using the provided example file, copy it from:

```txt
Documentation/env/.env.example
```

to:

```txt
.env
```

Do not commit `.env` because it contains local secrets and credentials.

The app validates these major environment groups:

- App config: `PORT`, `APP_URL`
- MongoDB: `MONGO_URI`
- JWT secrets: `JWT_SECRET`, `JWT_EXPIRES_IN`
- OTP settings: `OTP_EXPIRES_MINUTES`
- SMTP/email: `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`, `MAIL_FROM_NAME`
- Seed/admin bootstrap values: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME`
- Redis: `REDIS_HOST`, `REDIS_PORT`, optional `REDIS_PASSWORD`
- Rate limit values for login, register, OTP, resend OTP, and forgot password flows
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CURRENCY`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`
- RabbitMQ: `RABBITMQ_URL`, `RABBITMQ_NOTIFICATION_QUEUE`, `RABBITMQ_REALTIME_QUEUE`
- Analytics service URL: `ANALYTICS_SERVICE_URL`
- Cache TTL values: `CACHE_STOCKS_TTL_SECONDS`, `CACHE_PORTFOLIO_TTL_SECONDS`

The environment template also documents price alert limit values:

- `MAX_ACTIVE_PRICE_ALERTS_PER_MEMBER` for active alerts across all stocks.
- `MAX_ACTIVE_PRICE_ALERTS_PER_STOCK` for active alerts on the same stock.

Use local placeholder values for development secrets. Do not include real production secrets in documentation, commits, screenshots, or Postman exports.

## Docker Services

Start the local infrastructure:

```bash
docker compose up -d
```

Check that containers are running:

```bash
docker ps
```

The compose file may start these services:

- MongoDB: `localhost:27017`
- Mongo Express: `http://localhost:8081`
- Redis: `localhost:6379`
- RedisInsight: `http://localhost:5540`
- RabbitMQ: `localhost:5672`
- RabbitMQ Management UI: `http://localhost:15672`
- FastAPI analytics service: `http://localhost:8000`

MongoDB is configured with replica set support because order buy/sell flows use MongoDB sessions and transactions. For a fresh MongoDB volume, initialize the replica set once:

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

Then check:

```js
rs.status()
```

## Install Dependencies

Install Node dependencies:

```bash
npm install
```

## Run the NestJS App

Start the NestJS API in watch mode:

```bash
npm run start:dev
```

The default API base URL is:

```txt
http://localhost:3000/api
```

The global prefix is:

```txt
/api
```

## Run Seed Data

The project has one seed script:

```bash
npm run seed
```

The seed script connects using `MONGO_URI`, clears previous seed records, and creates local test data for:

- Admin, analyst, and support users
- Verified, unverified, suspended, and negative-balance members
- Stocks and price history
- Referrals
- Wallet transactions and pending withdrawals
- Completed buy/sell orders
- Open positions
- Price alerts
- Negative-balance and stale-withdrawal system alert snapshots

Use the negative-balance seed member only for negative-balance alert testing.

## Run the FastAPI Analytics Service

The FastAPI analytics service is started by Docker Compose as `analytics-service`.

Start it with the rest of the Docker services:

```bash
docker compose up -d
```

FastAPI URLs:

```txt
Base URL:    http://localhost:8000
Health:      GET http://localhost:8000/health
Swagger UI:  http://localhost:8000/docs
```

The NestJS app calls the analytics service through `ANALYTICS_SERVICE_URL`. The FastAPI service also needs to point to the same MongoDB database used by NestJS. If the database name differs, analytics endpoints can return empty results even when the NestJS app has seeded data.

## Final Checks

Run the production build:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

The `lint` script is available in `package.json` and runs ESLint with `--fix`.

## Postman Testing

Postman documentation and exports belong in:

```txt
Documentation/postman/
```

Recommended testing order:

1. Start Docker services.
2. Start the NestJS app.
3. Check FastAPI health at `GET http://localhost:8000/health`.
4. Run seed data.
5. Login as admin, analyst, support, and member seed users.
6. Test stocks.
7. Test wallet deposit and withdrawals.
8. Test orders and portfolio.
9. Test price alerts.
10. Test analytics.
11. Test system alerts.
12. Test audit logs.

Price alert testing flow:

1. Login as a member.
2. Create a price alert above or below the current stock price.
3. Login as an admin or analyst.
4. Update the stock `currentPrice` so it crosses the alert target.
5. Confirm the stock update request returns successfully.
6. Confirm the RabbitMQ consumer processes `stock.price.updated`.
7. Confirm the alert becomes triggered and the member receives an email through `NotificationsService`/Nodemailer.

Price alert limit test cases:

- Create 2 active alerts for the same stock: should pass.
- Create a 3rd active alert for the same stock: should fail.
- Create up to 6 active alerts total: should pass.
- Create a 7th active alert: should fail.

Triggered and deleted alerts should not count toward these active alert limits.

## Common Problems

Docker daemon is not running:

- Open Docker Desktop, wait until it is ready, then run `docker compose up -d` again.

MongoDB connection string is invalid:

- `MONGO_URI` must start with `mongodb://` or `mongodb+srv://`.
- For local transactions, use a replica set URI such as `mongodb://localhost:27017/stock_market_platform?replicaSet=rs0`.

FastAPI analytics returns empty data:

- Confirm the FastAPI `MONGO_DATABASE` matches the database used by NestJS.
- The Docker Compose analytics service is configured for `stock_market_platform`.

Redis is not running:

- Confirm the Redis container is running with `docker ps`.
- Check the NestJS logs for `Redis connected`.

Stripe webhook fails in Postman:

- `POST /api/payments/stripe/webhook` requires a valid `stripe-signature` header and the raw request body.
- For normal manual testing, use Stripe CLI or a correctly signed webhook event.

Rate limit errors in Postman:

- Login, register, OTP, resend OTP, and forgot-password flows use Redis-backed rate limits.
- Wait for the TTL window to expire or use different test input when intentionally testing non-rate-limit behavior.

Negative-balance seed member:

- `negative.seed@example.com` exists for negative-balance system alert testing only.
- Do not use that account as the normal member for wallet, order, or portfolio happy-path tests.

## Final Submission Checklist

- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
- [ ] Docker services start successfully.
- [ ] NestJS app starts successfully.
- [ ] FastAPI health check works.
- [ ] Seed data runs successfully.
- [ ] Postman collection is exported under `Documentation/postman/`.
- [ ] Documentation folder is completed.

# Stock Market Platform

## Overview

Stock Market Platform is a NestJS backend application for a simulated stock trading platform. It supports member onboarding, OTP email verification, referrals, admin users, stock catalogue management, wallet deposits, withdrawal requests, and transaction history.

## Tech Stack

- NestJS
- TypeScript
- MongoDB
- Mongoose
- JWT / Passport
- bcrypt
- Nodemailer
- Docker Compose
- Mongo Express
- class-validator / class-transformer
- Joi environment validation

## Completed Features

- Member authentication
- OTP email verification
- Referral registration
- Admin authentication
- Admin user provisioning
- Role-based admin access
- Stock catalogue
- Stock price history
- Wallet deposits
- Wallet withdrawal requests
- Wallet balance
- Transaction history

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

## Environment

Create a `.env` file in the project root using:

```txt
Documentation/.env.example
```

## Docker Commands

```bash
docker compose up -d
docker compose down
docker compose down -v
```

Use `docker compose down -v` only when you want to delete local MongoDB data.

## Branching Strategy

Feature branches are created from `development`.

Examples:

```txt
feat/auth
feat/admin-auth
feat/stocks
feat/wallet
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
docs(project): add initial documentation structure
```

## Documentation

Project documentation is stored in:

```txt
Documentation/
```

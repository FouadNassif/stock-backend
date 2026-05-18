# Schemas and Indexes

## 1. Overview

MongoDB is the main persistence database for the Stock Market Platform. The NestJS API uses Mongoose schemas to define collections, validation rules, references, enum values, timestamps, and indexes.

The FastAPI analytics service reads from the same MongoDB database directly. Because of that, the analytics service depends on the same collection names and field shapes used by the NestJS models.

ObjectId references connect members, admins, stocks, positions, orders, transactions, alerts, and audit logs. Indexes improve query performance and enforce uniqueness where required.

## 2. Main Collections

| Model | Purpose |
| --- | --- |
| Member | Stores member profile, wallet balance, identity status, and referral code. |
| Admin | Stores CMS/admin users and roles. |
| Otp | Stores hashed OTP sessions for verification and password reset. |
| Referral | Stores referral relationships between members. |
| Stock | Stores listed/delisted stock catalogue and current price. |
| PriceHistory | Stores historical stock prices. |
| Transaction | Stores wallet and trading transactions. |
| Position | Stores member holdings per stock. |
| Order | Stores buy/sell trade executions. |
| PriceAlert | Stores member price alerts. |
| AuditLog | Stores admin/member/system audit events. |
| NegativeBalanceAlert | Stores scheduled negative balance snapshots. |
| StalePendingWithdrawalAlert | Stores scheduled stale withdrawal snapshots. |

## 3. Schema Details

### Member

Purpose:

- Stores public investor/member accounts, wallet state, identity status, and referral code.

Important fields:

- `fullName`: string, required, trimmed.
- `email`: string, required, unique, lowercase, trimmed.
- `nationalId`: string, required, unique, trimmed.
- `dateOfBirth`: Date, required.
- `password`: string, optional, hashed after password setup.
- `emailVerified`: boolean, default `false`.
- `referralCode`: string, required, unique, uppercase, trimmed.
- `identityStatus`: enum, default `pending`.
- `isActive`: boolean, default `true`.
- `walletBalance`: number, default `0`, min `0`.
- `lastDepositAt`: Date, optional.
- `createdAt`, `updatedAt`: added by timestamps.

Relations:

- Referenced by `Otp.memberId`, `Referral.referrerId`, `Referral.referredMemberId`, `Transaction.memberId`, `Position.memberId`, `Order.memberId`, `PriceAlert.memberId`, and alert snapshot arrays.

Indexes:

- `email` unique.
- `nationalId` unique.
- `referralCode` unique.
- `{ emailVerified: 1 }`.
- `{ isActive: 1 }`.
- `{ identityStatus: 1 }`.

Notes:

- `identityStatus` values are `pending`, `approved`, and `rejected`.
- `walletBalance` normally has a minimum of `0`. The seed script intentionally creates a negative-balance data integrity case through a direct collection update for alert testing.

### Admin

Purpose:

- Stores internal CMS users and their access roles.

Important fields:

- `fullName`: string, required, trimmed.
- `email`: string, required, unique, lowercase, trimmed.
- `password`: string, required, hashed.
- `role`: enum, required.
- `isActive`: boolean, default `true`.
- `mustChangePassword`: boolean, default `false`.
- `createdBy`: ObjectId reference to `Admin`, optional.
- `lastLoginAt`: Date, optional.
- `createdAt`, `updatedAt`: added by timestamps.

Relations:

- `createdBy` references another `Admin`.
- Admin IDs are stored in audit logs as `actorId` for admin actions.

Indexes:

- `email` unique.
- `{ role: 1 }`.
- `{ isActive: 1 }`.
- `{ createdAt: -1 }`.

Notes:

- `role` values are `admin`, `analyst`, and `support`.
- Admin email uniqueness is also checked against member emails in service logic.

### Otp

Purpose:

- Stores OTP sessions for member email verification and password reset.

Important fields:

- `memberId`: ObjectId reference to `Member`, required.
- `verificationId`: string, required, unique.
- `codeHash`: string, required, hashed OTP value.
- `purpose`: enum, required.
- `expiresAt`: Date, required.
- `used`: boolean, default `false`.
- `usedAt`: Date, optional.
- `attempts`: number, default `0`.
- `maxAttempts`: number, default `5`.
- `ipAddress`: string, optional.
- `userAgent`: string, optional.
- `createdAt`, `updatedAt`: added by timestamps.

Relations:

- `memberId` references the member who owns the OTP.

Indexes:

- `verificationId` unique.
- `{ memberId: 1, purpose: 1, used: 1 }`.
- `{ expiresAt: 1 }` with `{ expireAfterSeconds: 0 }` TTL.

Notes:

- `purpose` values are `email_verification` and `password_reset`.
- The TTL index automatically removes expired OTP records after `expiresAt`.
- OTP codes are never stored in plain text.

### Referral

Purpose:

- Stores referral relationships between a referrer member and a referred member.

Important fields:

- `referrerId`: ObjectId reference to `Member`, required.
- `referredMemberId`: ObjectId reference to `Member`, required, unique.
- `referralCode`: string, required, uppercase, trimmed.
- `status`: enum, required, default `registered`.
- `registeredAt`: Date, optional.
- `emailVerifiedAt`: Date, optional.
- `createdAt`, `updatedAt`: added by timestamps.

Relations:

- `referrerId` points to the member who owns the referral code.
- `referredMemberId` points to the new member who used the referral code.

Indexes:

- `referredMemberId` unique.
- `{ referrerId: 1, createdAt: -1 }`.
- `{ referralCode: 1 }`.
- `{ status: 1 }`.

Notes:

- `status` values are `registered`, `email_verified`, `rewarded`, and `cancelled`.
- Referral creation is implemented. The email-verified referral status update method exists, but the current call path should be checked before documenting reward behavior.

### Stock

Purpose:

- Stores the stock catalogue, listing status, and current price.

Important fields:

- `ticker`: string, required, unique, uppercase, trimmed.
- `companyName`: string, required, trimmed.
- `sector`: string, required, trimmed.
- `description`: string, optional.
- `currentPrice`: number, required, min `0`.
- `isListed`: boolean, default `true`.
- `createdAt`, `updatedAt`: added by timestamps.

Relations:

- Referenced by `PriceHistory.stockId`, `Order.stockId`, `Position.stockId`, and `PriceAlert.stockId`.

Indexes:

- `ticker` unique.
- `{ sector: 1 }`.
- `{ isListed: 1 }`.
- `{ companyName: 1 }`.

Notes:

- Used by orders, positions, price history, price alerts, stock cache, portfolio calculations, and analytics.
- Delisting updates `isListed` instead of deleting the stock.

### PriceHistory

Purpose:

- Stores historical price records for stocks.

Important fields:

- `stockId`: ObjectId reference to `Stock`, required.
- `price`: number, required, min `0`.
- `recordedAt`: Date, required, default `Date.now`.
- `createdAt`, `updatedAt`: added by timestamps.

Relations:

- `stockId` references the stock whose price was recorded.

Indexes:

- `{ stockId: 1, recordedAt: -1 }`.

Notes:

- Created when a stock is created and when `currentPrice` changes.
- Used by the stock history API.

### Transaction

Purpose:

- Stores wallet and trading financial events.

Important fields:

- `memberId`: ObjectId reference to `Member`, required.
- `type`: enum, required.
- `amount`: number, required, min `0`.
- `status`: enum, required, default `pending`.
- `referenceId`: string, required, trimmed.
- `notes`: string, optional.
- `balanceBefore`: number, required, min `0`.
- `balanceAfter`: number, required, min `0`.
- `stripeSessionId`: string, optional.
- `stripePaymentIntentId`: string, optional.
- `rejectedReason`: string, optional.
- `processedAt`: Date, optional.
- `createdAt`, `updatedAt`: added by timestamps.

Relations:

- `memberId` references the member who owns the transaction.
- `referenceId` is used as a business reference. For trade transactions, it stores the related order ID string. For deposits and withdrawals, it stores generated references.

Indexes:

- `{ memberId: 1, createdAt: -1 }`.
- `{ memberId: 1, type: 1 }`.
- `{ status: 1 }`.
- `{ type: 1 }`.
- `{ referenceId: 1 }` unique.
- `{ stripeSessionId: 1 }`.
- `{ stripePaymentIntentId: 1 }`.

Notes:

- `type` values are `deposit`, `withdrawal`, `buy`, `sell`, and `adjustment`.
- `status` values are `pending`, `completed`, and `rejected`.
- Used for deposits, withdrawals, buy/sell trades, manual wallet adjustments, and admin analytics.

### Position

Purpose:

- Stores a member's stock holdings and open/closed position state.

Important fields:

- `memberId`: ObjectId reference to `Member`, required.
- `stockId`: ObjectId reference to `Stock`, required.
- `sharesHeld`: number, required, min `0`.
- `avgPurchasePrice`: number, required, min `0`.
- `status`: enum, required, default `open`.
- `openedAt`: Date, required, default `Date.now`.
- `closedAt`: Date, optional.
- `createdAt`, `updatedAt`: added by timestamps.

Relations:

- `memberId` references the member who owns the position.
- `stockId` references the stock being held.
- `Order.positionId` references a position.

Indexes:

- `{ memberId: 1, status: 1 }`.
- `{ memberId: 1, stockId: 1, status: 1 }`.
- `{ stockId: 1 }`.

Notes:

- `status` values are `open` and `closed`.
- Open positions are used for portfolio views and AUM/sector allocation analytics.

### Order

Purpose:

- Stores buy/sell trade execution records.

Important fields:

- `memberId`: ObjectId reference to `Member`, required.
- `stockId`: ObjectId reference to `Stock`, required.
- `positionId`: ObjectId reference to `Position`, required.
- `type`: enum, required.
- `quantity`: number, required, min `1`.
- `priceAtExecution`: number, required, min `0`.
- `totalAmount`: number, required, min `0`.
- `status`: enum, required, default `completed`.
- `realizedProfitLoss`: number, default `0`.
- `createdAt`, `updatedAt`: added by timestamps.

Relations:

- References `Member`, `Stock`, and `Position`.
- Related trade `Transaction` records use the order ID string as `referenceId`.

Indexes:

- `{ memberId: 1, createdAt: -1 }`.
- `{ memberId: 1, type: 1 }`.
- `{ stockId: 1 }`.
- `{ status: 1 }`.

Notes:

- `type` values are `buy` and `sell`.
- `status` values are `completed` and `rejected`.
- Used for order history, trading volume, top traded stocks, and active member analytics.

### PriceAlert

Purpose:

- Stores member-specific price alerts for stocks.

Important fields:

- `memberId`: ObjectId reference to `Member`, required.
- `stockId`: ObjectId reference to `Stock`, required.
- `targetPrice`: number, required, min `0`.
- `direction`: enum, required.
- `triggered`: boolean, default `false`.
- `triggeredAt`: Date, optional.
- `createdAt`, `updatedAt`: added by timestamps.

Relations:

- `memberId` references the member who owns the alert.
- `stockId` references the stock being watched.

Indexes:

- `{ memberId: 1, triggered: 1 }`.
- `{ stockId: 1, triggered: 1 }`.
- `{ stockId: 1, direction: 1, triggered: 1 }`.
- `{ memberId: 1, stockId: 1, direction: 1, targetPrice: 1, triggered: 1 }`.

Notes:

- `direction` values are `above` and `below`.
- Duplicate active alert prevention is handled in service logic. The compound alert-condition index is not declared as unique.
- Triggered alerts can publish notification events.

### AuditLog

Purpose:

- Stores audit events for admin, member, and system actions.

Important fields:

- `actorId`: ObjectId, optional.
- `actorType`: enum, required.
- `action`: enum, required.
- `targetType`: enum, required.
- `targetId`: ObjectId, optional.
- `description`: string, required.
- `reason`: string, optional.
- `changes`: mixed object, optional.
- `metadata`: mixed object, optional.
- `ipAddress`: string, optional.
- `userAgent`: string, optional.
- `createdAt`, `updatedAt`: added by timestamps.

Relations:

- `actorId` and `targetId` can reference different collections depending on `actorType` and `targetType`.

Indexes:

- `{ actorId: 1, createdAt: -1 }`.
- `{ targetId: 1, createdAt: -1 }`.
- `{ action: 1, createdAt: -1 }`.
- `{ targetType: 1, createdAt: -1 }`.

Notes:

- `actorType` values are `admin`, `member`, and `system`.
- `targetType` values include `member`, `admin`, `stock`, `wallet`, `withdrawal`, `transaction`, `order`, `position`, `price_alert`, and `system`.
- Actions include admin creation, identity approval/rejection, member suspension/reinstatement, wallet adjustment, withdrawal approval/rejection, stock changes, and price alert events.

### NegativeBalanceAlert

Purpose:

- Stores scheduled snapshots of members whose wallet balances are negative.

Important fields:

- `members`: snapshot array, default `[]`.
- `members.memberId`: ObjectId reference to `Member`, required inside snapshot.
- `members.fullName`: string, required.
- `members.email`: string, required.
- `members.walletBalance`: number, required.
- `totalCount`: number, required, default `0`.
- `checkedAt`: Date, required.
- `createdAt`, `updatedAt`: added by timestamps.

Relations:

- Snapshot entries include `memberId` references to members.

Indexes:

- `{ checkedAt: -1 }`.
- `{ createdAt: -1 }`.

Notes:

- Stores a snapshot, not live member records.
- Used by the CMS/admin alert view for data integrity issues.

### StalePendingWithdrawalAlert

Purpose:

- Stores scheduled snapshots of pending withdrawals older than the configured threshold.

Important fields:

- `withdrawals`: snapshot array, default `[]`.
- `withdrawals.transactionId`: ObjectId reference to `Transaction`, required.
- `withdrawals.memberId`: ObjectId reference to `Member`, required.
- `withdrawals.memberFullName`: string, required, trimmed.
- `withdrawals.memberEmail`: string, required, lowercase, trimmed.
- `withdrawals.amount`: number, required, min `0`.
- `withdrawals.status`: string, required.
- `withdrawals.requestedAt`: Date, required.
- `withdrawals.ageHours`: number, required, min `0`.
- `totalCount`: number, required, default `0`.
- `thresholdHours`: number, required, default `24`.
- `checkedAt`: Date, required.
- `createdAt`, `updatedAt`: added by timestamps.

Relations:

- Snapshot entries include references to `Transaction` and `Member`.

Indexes:

- `{ checkedAt: -1 }`.
- `{ createdAt: -1 }`.

Notes:

- Stores a snapshot of stale pending withdrawals, not live withdrawal records.
- The service currently uses a 24-hour stale threshold constant.

## 4. Relationship Summary

- Member has many Transactions.
- Member has many Orders.
- Member has many Positions.
- Member has many PriceAlerts.
- Member has many Otp records.
- Stock has many PriceHistory records.
- Stock has many Orders and Positions.
- Stock has many PriceAlerts.
- Order references Member, Stock, and Position.
- Transaction references Member and often uses `referenceId` to connect to orders, deposits, withdrawals, or manual adjustments.
- Referral connects a referrer Member to a referred Member.
- Admin can create other Admin users through `createdBy`.
- AuditLog can reference different actor and target types through `actorId`, `actorType`, `targetId`, and `targetType`.
- NegativeBalanceAlert and StalePendingWithdrawalAlert store snapshots that include member and transaction references.

## 5. Index Summary

| Model | Index | Purpose |
| --- | --- | --- |
| Member | `email` unique | Prevent duplicate member emails. |
| Member | `nationalId` unique | Prevent duplicate identity registration. |
| Member | `referralCode` unique | Prevent duplicate referral codes. |
| Member | `{ emailVerified: 1 }` | Filter verified/unverified members. |
| Member | `{ isActive: 1 }` | Filter active/suspended members. |
| Member | `{ identityStatus: 1 }` | Filter identity review status. |
| Admin | `email` unique | Prevent duplicate CMS users. |
| Admin | `{ role: 1 }` | Filter admins by role. |
| Admin | `{ isActive: 1 }` | Filter active/inactive admins. |
| Admin | `{ createdAt: -1 }` | Sort newest admins first. |
| Otp | `verificationId` unique | Find one OTP session by public verification ID. |
| Otp | `{ memberId: 1, purpose: 1, used: 1 }` | Find active OTPs per member and purpose. |
| Otp | `{ expiresAt: 1 }` TTL | Auto-delete expired OTP records. |
| Referral | `referredMemberId` unique | Prevent one member from being referred multiple times. |
| Referral | `{ referrerId: 1, createdAt: -1 }` | List referrals by referrer. |
| Referral | `{ referralCode: 1 }` | Find referrals by code. |
| Referral | `{ status: 1 }` | Filter referrals by status. |
| Stock | `ticker` unique | Prevent duplicate stock tickers. |
| Stock | `{ sector: 1 }` | Filter stocks by sector. |
| Stock | `{ isListed: 1 }` | Filter listed/delisted stocks. |
| Stock | `{ companyName: 1 }` | Support company-name lookup/sorting. |
| PriceHistory | `{ stockId: 1, recordedAt: -1 }` | Fetch stock price history newest first. |
| Transaction | `{ memberId: 1, createdAt: -1 }` | List member transactions newest first. |
| Transaction | `{ memberId: 1, type: 1 }` | Filter member transactions by type. |
| Transaction | `{ status: 1 }` | Filter transactions by status. |
| Transaction | `{ type: 1 }` | Filter deposits, withdrawals, trades, adjustments. |
| Transaction | `{ referenceId: 1 }` unique | Prevent duplicate transaction references. |
| Transaction | `{ stripeSessionId: 1 }` | Lookup Stripe checkout sessions. |
| Transaction | `{ stripePaymentIntentId: 1 }` | Lookup Stripe payment intents. |
| Position | `{ memberId: 1, status: 1 }` | Fetch member open/closed positions. |
| Position | `{ memberId: 1, stockId: 1, status: 1 }` | Find a member's open position for a stock. |
| Position | `{ stockId: 1 }` | Find positions by stock. |
| Order | `{ memberId: 1, createdAt: -1 }` | List member order history newest first. |
| Order | `{ memberId: 1, type: 1 }` | Filter member orders by buy/sell. |
| Order | `{ stockId: 1 }` | Analytics and stock trade lookups. |
| Order | `{ status: 1 }` | Filter orders by status. |
| PriceAlert | `{ memberId: 1, triggered: 1 }` | List member alerts by trigger state. |
| PriceAlert | `{ stockId: 1, triggered: 1 }` | Find active alerts for a stock. |
| PriceAlert | `{ stockId: 1, direction: 1, triggered: 1 }` | Check alerts by direction and active state. |
| PriceAlert | `{ memberId: 1, stockId: 1, direction: 1, targetPrice: 1, triggered: 1 }` | Support duplicate-condition checks. |
| AuditLog | `{ actorId: 1, createdAt: -1 }` | Filter audit logs by actor. |
| AuditLog | `{ targetId: 1, createdAt: -1 }` | Filter audit logs by target. |
| AuditLog | `{ action: 1, createdAt: -1 }` | Filter audit logs by action. |
| AuditLog | `{ targetType: 1, createdAt: -1 }` | Filter audit logs by target type. |
| NegativeBalanceAlert | `{ checkedAt: -1 }` | Read latest snapshot. |
| NegativeBalanceAlert | `{ createdAt: -1 }` | Sort snapshots by creation time. |
| StalePendingWithdrawalAlert | `{ checkedAt: -1 }` | Read latest snapshot. |
| StalePendingWithdrawalAlert | `{ createdAt: -1 }` | Sort snapshots by creation time. |

## 6. Analytics Usage

FastAPI analytics reads these MongoDB collections directly:

- `orders`
- `stocks`
- `members`
- `positions`
- `transactions`

Analytics queries:

- Trading volume uses `orders`.
- Top traded stocks uses `orders` and `stocks`.
- AUM uses `members`, `positions`, and `stocks`.
- Active members uses `orders` and `members`.
- Sector allocation uses `positions` and `stocks`.
- Admin summary uses `members` and `transactions` for pending withdrawal counts and amounts.

FastAPI must point to the same database as NestJS. If it connects to a different database name, analytics responses can be empty even when the API has data.

## 7. Important Notes

- Do not manually edit MongoDB data in production.
- Negative wallet balances are treated as data integrity issues and surfaced by scheduled alerts.
- All schema files found in the codebase use Mongoose timestamps.
- Seed data is for local testing only.
- The seed script cleans known seed records before inserting new seed data.
- Unique indexes can still cause duplicate key errors if manual data or partial seed cleanup leaves conflicting records.
- MongoDB replica set support is required for transaction/session flows used by orders, withdrawals, wallet adjustments, and Stripe deposit completion.

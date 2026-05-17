# Seed Data

This document explains the local seed data used for end-to-end testing and Postman examples in the Stock Market Platform project.

## 1. Overview

Seed data is intended for local development and assignment testing only. It creates enough data to exercise the main API flows, including authentication, CMS/admin roles, stocks, wallet operations, orders, portfolio, price alerts, analytics, scheduled system alerts, and audit-log-producing actions where applicable.

Run the seed after MongoDB and the required Docker services are running. Do not run the seed against production or shared data.

The seed connects directly to MongoDB using `MONGO_URI` from `.env`, deletes the known seed records, recreates them, and prints useful IDs for Postman variables.

## 2. Seed Command

The project defines this seed command in `package.json`:

```bash
npm run seed
```

Before running it:

- Start the Docker services, especially MongoDB.
- Make sure `.env` is configured and includes `MONGO_URI`.
- If the application depends on MongoDB transactions, use the provided local Docker MongoDB setup so the database configuration matches the app.

## 3. Seeded Admin Users

| Name | Email | Password | Role | Used For |
| --- | --- | --- | --- | --- |
| Omar Seed Admin | admin.seed@stockmarket.com | Admin@12345 | admin | Full CMS access, admin-only routes, user management, analytics summary, system alerts. |
| Leila Seed Analyst | analyst.seed@stockmarket.com | Analyst@12345 | analyst | Stock and analytics permission testing where analyst access is allowed. |
| Sam Seed Support | support.seed@stockmarket.com | Support@12345 | support | Member support, withdrawal review, and support-level CMS testing where allowed. |

## 4. Seeded Members

| Name | Email | Password | Email Verified | Identity Status | Active | Purpose |
| --- | --- | --- | --- | --- | --- | --- |
| Adam Seed Investor | adam.seed@example.com | Adam@12345 | Yes | approved | Yes | Main approved member for wallet, deposits, withdrawals, orders, portfolio, alerts, and analytics testing. Seed wallet balance is 5000. |
| Sara Seed Investor | sara.seed@example.com | Sara@12345 | Yes | approved | Yes | Second approved member for referral, extra trading, and analytics data. Seed wallet balance is 100. |
| Unverified Seed Member | unverified.seed@example.com | No password | No | pending | Yes | Registration, verification, and identity workflow reference data. This account is not ready for normal login. |
| Suspended Seed Member | suspended.seed@example.com | Suspended@12345 | Yes | approved | No | Login and permission error testing for inactive members. Seed wallet balance is 300. |
| Negative Balance Seed Member | negative.seed@example.com | Negative@12345 | Yes | approved | Yes | Negative-balance system alert testing only. Seed wallet balance is forced to -50 as a data-integrity test case. |

The negative-balance member should not be used for normal member flows. It exists only so the scheduled alert and CMS alert routes can detect an invalid wallet state.

## 5. Seeded Stocks

| Ticker | Company | Sector | Price | Listed | Used For |
| --- | --- | --- | --- | --- | --- |
| AAPL | Apple Inc. | Technology | 180 | Yes | Main stock for buy/sell, portfolio, price history, and price alert tests. |
| MSFT | Microsoft Corporation | Technology | 420 | Yes | Additional listed stock for portfolio, analytics, and alert tests. |
| TSLA | Tesla Inc. | Automotive | 250 | Yes | Secondary member position/order data and below-target alert testing. |
| JPM | JPMorgan Chase & Co. | Finance | 200 | Yes | Public stock catalogue and sector allocation coverage. |
| PFE | Pfizer Inc. | Healthcare | 35 | Yes | Public stock catalogue and sector allocation coverage. |
| XOM | Exxon Mobil Corporation | Energy | 115 | Yes | Public stock catalogue and sector allocation coverage. |
| OLDX | Old Exchange Corp. | Finance | 12 | No | Delisted-stock testing, especially rejected buy order behavior. |

The seed also creates three price history records for each stock so stock history and analytics routes have historical data to read.

## 6. Seeded Transactions and Wallet Data

The seed creates wallet and trading transactions for local testing:

- Adam has a completed deposit for `7000` with reference `SEED-DEP-ADAM-001`.
- Adam has completed buy/sell trading transactions tied to seeded AAPL and MSFT orders.
- Sara has a completed buy transaction tied to a seeded TSLA order.
- The negative-balance member has a completed withdrawal with reference `SEED-WD-NEGATIVE-001` to support negative-balance alert testing.
- Adam has a pending withdrawal with reference `SEED-WD-PENDING-001` for approve/reject route testing.
- Adam has a stale pending withdrawal with reference `SEED-WD-STALE-001`, created about 30 hours before seeding, for stale pending withdrawal alert testing.
- The seed does not create a separate manual wallet adjustment record. Use the admin wallet-adjustment route to create one during testing if needed.

The seed output prints:

- Pending withdrawal ID: copy to `withdrawal_id`.
- Stale withdrawal ID: copy to `stale_withdrawal_id`.

This data supports:

- `GET /wallet/balance`
- `GET /wallet/transactions`
- `POST /wallet/withdraw`
- `GET /admin/withdrawals`
- `POST /admin/withdrawals/:id/approve`
- `POST /admin/withdrawals/:id/reject`
- `GET /admin/alerts/stale-pending-withdrawals`
- `POST /admin/alerts/stale-pending-withdrawals/run`

After approving or rejecting a seeded pending withdrawal, rerun the seed if you need the original pending state again.

## 7. Seeded Orders and Positions

The seed creates completed orders and open positions:

- Adam has an open AAPL position with 8 shares at an average purchase price of 150.
- Adam has an open MSFT position with 2 shares at an average purchase price of 380.
- Sara has an open TSLA position with 1 share at an average purchase price of 230.
- Adam has completed buy and sell orders for AAPL.
- Adam has a completed buy order for MSFT.
- Sara has a completed buy order for TSLA.

No closed position is explicitly seeded. Closed-position behavior can be tested by selling a full holding through the API.

This trading data supports:

- `POST /orders/buy`
- `POST /orders/sell`
- `GET /orders/portfolio`
- `GET /orders/history`
- Admin member order review routes
- Analytics routes for trading volume, top stocks, active members, AUM, and sector allocation

## 8. Seeded Price Alerts

| Member | Stock | Direction | Target Price | Triggered |
| --- | --- | --- | --- | --- |
| Adam Seed Investor | AAPL | above | 200 | No |
| Adam Seed Investor | TSLA | below | 220 | No |
| Adam Seed Investor | MSFT | above | 400 | Yes |

These alerts support:

- `POST /alerts`
- `GET /alerts`
- `DELETE /alerts/:id`
- Stock price update alert-trigger behavior, if triggered by the stock update implementation

The seed does not print price alert IDs. Get them from `GET /alerts` after logging in as Adam.

## 9. Seeded System Alert Data

The seed creates system alert test data and stored snapshots:

- A negative-balance test member with wallet balance `-50`.
- A negative-balance alert snapshot with `totalCount` set to `1`.
- A stale pending withdrawal for Adam that is older than the 24-hour threshold.
- A stale pending withdrawal alert snapshot with `totalCount` set to `1` and `thresholdHours` set to `24`.

This data supports:

- `GET /admin/alerts/negative-balances`
- `POST /admin/alerts/negative-balances/run`
- `GET /admin/alerts/stale-pending-withdrawals`
- `POST /admin/alerts/stale-pending-withdrawals/run`

The negative-balance member is only for the alert/data-integrity case and should not be used for regular wallet or trading tests.

## 10. Postman Variables from Seed

Copy these values from the seed output or obtain them from API list routes:

| Variable | Source |
| --- | --- |
| `admin_token` | Login with `admin.seed@stockmarket.com` and save the returned token. |
| `analyst_token` | Login with `analyst.seed@stockmarket.com` and save the returned token. |
| `support_token` | Login with `support.seed@stockmarket.com` and save the returned token. |
| `member_token` | Login with `adam.seed@example.com` and save the returned token. |
| `member_id` | Use the printed Adam member ID for normal member tests, or another printed member ID for special cases. |
| `stock_id` | Use a printed stock ID, commonly AAPL for buy/sell and alert tests. |
| `ticker` | Use `AAPL` for normal tests or `OLDX` for delisted-stock rejection tests. |
| `withdrawal_id` | Use the printed pending withdrawal ID. |
| `stale_withdrawal_id` | Use the printed stale withdrawal ID. |
| `price_alert_id` | Not printed by the seed. Get it from `GET /alerts` as Adam. |
| `order_id` | Not printed by the seed. Get it from `GET /orders/history` or admin member order routes. |
| `transaction_id` | Not printed by the seed except withdrawal transaction IDs. Get it from `GET /wallet/transactions` or admin member transaction routes. |

The current Postman folder is `Documentation/postman/`. If the collection is not exported yet, use the seed output and API responses to fill the variables manually.

## 11. Recommended Testing Order After Seeding

1. Start Docker services.
2. Confirm `.env` is configured and points to the local MongoDB database.
3. Run `npm run seed`.
4. Start or restart the NestJS app.
5. Login admin, analyst, support, and member accounts.
6. Save tokens in Postman variables.
7. Test public stocks.
8. Test member wallet and portfolio.
9. Test orders buy/sell.
10. Test price alerts.
11. Test admin member management.
12. Test withdrawals.
13. Test analytics.
14. Test system alerts.
15. Test audit logs by performing admin or member actions that create log entries.

## 12. Resetting or Re-running Seed Data

The seed is designed to clean and recreate known seed data. It removes records tied to the configured seed emails, seed stock tickers, `SEED-` transaction references, and related seeded relationships before inserting fresh records.

The seed is not a general database reset. It does not remove unrelated manual test data. If you manually create records that conflict with seed emails, stock tickers, referral codes, or other unique values, rerunning the seed may still fail with duplicate key errors.

If duplicate key errors happen in local development:

- Check the seed script before rerunning in a database that already contains manual test data.
- Remove or rename the conflicting local test records.
- Use a fresh local database only when it is acceptable to lose local test data.

Seed IDs can change after every rerun, so refresh Postman variables after reseeding.

## 13. Important Notes

- Never run seed data against production.
- Seed users and passwords are safe local test credentials only.
- FastAPI analytics depends on the seeded members, stocks, orders, positions, and transactions.
- Audit logs are usually best tested by performing API actions after seeding, because the seed inserts most data directly.
- Redis cache may need to be refreshed with `clear=1` or `clear=true` on cached routes after reseeding.
- Re-export Postman examples if seed data changes significantly.

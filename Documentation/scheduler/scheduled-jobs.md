# Scheduled Jobs

This document explains the scheduled jobs used by the Stock Market Platform, especially the system alert snapshot jobs for CMS/admin review.

## 1. Overview

The project uses scheduled jobs to run system checks automatically in the NestJS application. These checks create MongoDB snapshot records instead of only returning live calculations.

Snapshots are used by CMS/admin dashboard routes so administrators can read the latest known system alert state. Manual run routes also exist for Postman testing and operational checks.

Current scheduled jobs:

| Job | Purpose |
| --- | --- |
| Negative balance check | Detect members whose wallet balance is below zero. |
| Stale pending withdrawal check | Detect withdrawal transactions that have stayed pending longer than the threshold. |

## 2. Scheduler Setup

Scheduling is enabled in `src/app.module.ts` with:

```ts
ScheduleModule.forRoot()
```

The scheduler providers are registered through `SchedulerJobsModule`, which imports `SystemAlertsModule` and provides:

- `NegativeBalanceJob`
- `StalePendingWithdrawalsJob`

Both jobs use `@Cron(...)` decorators from `@nestjs/schedule` and call methods on `SystemAlertsService`.

Scheduled jobs run only while the NestJS app is running. MongoDB must also be available because each job stores a snapshot document. Cron timing is based on the server/runtime timezone unless a timezone is configured separately; no custom timezone is configured in the current job decorators.

The job enabled flags are hardcoded in `SchedulerJobEnabled`:

| Job Flag | Current Value |
| --- | --- |
| `negativeBalanceCheck` | `true` |
| `stalePendingWithdrawalsCheck` | `true` |

## 3. Negative Balance Check

Purpose:

- Detect members whose `walletBalance` is below `0`.
- Surface possible data integrity issues in the CMS/admin dashboard.

Query behavior:

- Reads the `Member` collection.
- Filters members with `walletBalance: { $lt: 0 }`.
- Selects `fullName`, `email`, and `walletBalance`.
- Sorts by `walletBalance` ascending, so the most negative balances appear first.

Stored snapshot:

- Collection/model: `NegativeBalanceAlert`.
- Fields: `members`, `totalCount`, `checkedAt`, plus timestamps.
- Each member snapshot includes `memberId`, `fullName`, `email`, and `walletBalance`.

Schedule:

| Code Constant | Cron Expression | Meaning |
| --- | --- | --- |
| `CronExpression.EVERY_DAY_AT_MIDNIGHT` | `0 0 * * *` | Runs every day at midnight. |

Routes:

| Route | Auth / Role | Purpose |
| --- | --- | --- |
| `POST /admin/alerts/negative-balances/run` | Admin JWT + admin role | Runs the check manually and creates a new snapshot. |
| `GET /admin/alerts/negative-balances` | Admin JWT + admin role | Reads the latest negative-balance snapshot. |

Negative wallet balances should not normally happen. The seed data may create a negative-balance member only to test this alert/data-integrity case.

## 4. Stale Pending Withdrawal Check

Purpose:

- Detect withdrawal transactions that remain pending longer than the operational threshold.
- Help support/admin teams find withdrawals awaiting review.
- This job does not approve or reject withdrawals; it only creates alert snapshots.

Threshold:

- `STALE_PENDING_WITHDRAWAL_HOURS = 24`
- The threshold is currently a hardcoded service constant, not an environment variable.

Query behavior:

- Reads the `Transaction` collection.
- Filters by `type = withdrawal`.
- Filters by `status = pending`.
- Filters by `createdAt <= thresholdDate`.
- Populates `memberId` to include member name and email.
- Sorts by `createdAt` ascending, so the oldest pending withdrawals appear first.

Stored snapshot:

- Collection/model: `StalePendingWithdrawalAlert`.
- Fields: `withdrawals`, `totalCount`, `thresholdHours`, `checkedAt`, plus timestamps.
- Each withdrawal snapshot includes `transactionId`, `memberId`, `memberFullName`, `memberEmail`, `amount`, `status`, `requestedAt`, and `ageHours`.

Schedule:

| Code Constant | Cron Expression | Meaning |
| --- | --- | --- |
| `CronExpression.EVERY_DAY_AT_9AM` | `0 09 * * *` | Runs every day at 9:00 AM. |

Routes:

| Route | Auth / Role | Purpose |
| --- | --- | --- |
| `POST /admin/alerts/stale-pending-withdrawals/run` | Admin JWT + support role, with admin superuser access | Runs the check manually and creates a new snapshot. |
| `GET /admin/alerts/stale-pending-withdrawals` | Admin JWT + support role, with admin superuser access | Reads the latest stale pending withdrawal snapshot. |

## 5. Manual Run Routes

| Job | Manual Route | Auth / Role | Purpose |
| --- | --- | --- | --- |
| Negative balance check | `POST /admin/alerts/negative-balances/run` | Admin JWT + admin role | Creates a new negative-balance snapshot. |
| Stale pending withdrawal check | `POST /admin/alerts/stale-pending-withdrawals/run` | Admin JWT + support role/admin superuser | Creates a new stale-withdrawal snapshot. |

The `AdminRolesGuard` allows the `admin` role to pass all admin role checks, so admin users can access support-role routes.

## 6. Latest Snapshot Routes

| Snapshot | Read Route | Auth / Role | Returns |
| --- | --- | --- | --- |
| Negative balance | `GET /admin/alerts/negative-balances` | Admin JWT + admin role | Latest `NegativeBalanceAlert` snapshot. |
| Stale pending withdrawals | `GET /admin/alerts/stale-pending-withdrawals` | Admin JWT + support role/admin superuser | Latest `StalePendingWithdrawalAlert` snapshot. |

The latest snapshot is selected with:

```ts
.sort({ checkedAt: -1 })
```

If no snapshot exists yet, the route throws `NotFoundException`. During Postman testing, run the matching manual route first if needed.

## 7. Snapshot Storage

Snapshots are stored in MongoDB as alert records. This preserves a history of checks over time; multiple scheduled/manual runs create multiple snapshot documents.

Snapshot records are not the same as the live source documents:

- `NegativeBalanceAlert` stores member snapshots from the `Member` collection at the time of the check.
- `StalePendingWithdrawalAlert` stores withdrawal snapshots from the `Transaction` collection at the time of the check.

Both alert schemas have indexes on:

- `{ checkedAt: -1 }`
- `{ createdAt: -1 }`

Schema details and indexes are documented separately in:

```txt
Documentation/database/schemas-and-indexes.md
```

## 8. Testing in Postman

Recommended testing steps:

1. Start Docker services and the NestJS app.
2. Run seed data.
3. Login as the required admin/support user.
4. Run the negative balance manual check.
5. Get the latest negative balance snapshot.
6. Run the stale pending withdrawal manual check.
7. Get the latest stale pending withdrawal snapshot.
8. Confirm snapshots have the expected `totalCount` and data.
9. Save success examples in Postman.

Testing notes:

- Use the seeded negative-balance member only for the negative-balance alert test.
- Use the seeded stale pending withdrawal transaction if available.
- If no stale withdrawals exist, the stale snapshot may return `totalCount: 0`.
- If no negative-balance members exist, the negative-balance snapshot may return `totalCount: 0`.

## 9. Common Issues

No snapshot found:

- Run the manual check route first.

Empty snapshot:

- Seed data may not contain matching negative-balance or stale-withdrawal data.
- A withdrawal may no longer be pending if it was approved or rejected during testing.

Cron did not run:

- The NestJS app may not have been running at the scheduled time.
- The job enabled flag may have been changed in code.

Wrong timezone:

- Schedules use the server/container timezone unless configured otherwise.

MongoDB unavailable:

- The job cannot create a snapshot if MongoDB is down or the app cannot connect.

Duplicate expectations:

- Snapshots are historical. Multiple manual runs or scheduled runs create multiple records, and the read route returns the latest by `checkedAt`.

## 10. Production Notes

- Keep schedules aligned with business review windows.
- Monitor job logs and failures.
- Avoid long-running jobs that block the event loop.
- Consider notifying administrators when snapshots contain critical results.
- Do not manually create negative balances in production.
- Stale withdrawal thresholds should match the operational SLA.

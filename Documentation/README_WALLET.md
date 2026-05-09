# Wallet Documentation

## Purpose

The Wallet module handles member deposits, withdrawal requests, balance, and transaction history.

## Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/wallet/deposit` | Deposit money |
| POST | `/api/wallet/withdraw` | Request withdrawal |
| GET | `/api/wallet/balance` | Get wallet balance |
| GET | `/api/wallet/transactions` | Get transaction history |

## Deposit Body

```json
{
  "amount": 1000
}
```

## Withdraw Body

```json
{
  "amount": 100
}
```

## Transaction Filters

```txt
GET /api/wallet/transactions?type=deposit
GET /api/wallet/transactions?status=completed
GET /api/wallet/transactions?from=2026-05-01&to=2026-05-09
GET /api/wallet/transactions?page=1&limit=10
```

## Business Rules

- Deposits are simulated as successful for now.
- Deposit creates a completed deposit transaction.
- Deposit increases `member.walletBalance`.
- Deposit updates `member.lastDepositAt`.
- Deposit sends confirmation email.
- Withdrawal is blocked if wallet balance is insufficient.
- Withdrawal is blocked if less than 48 hours passed from the latest deposit.
- Pending withdrawals reserve available balance.
- Withdrawal creates a pending transaction and does not deduct balance immediately.
- Admin/support approval workflow will be added later.

# Postman Documentation

## Purpose

The final Postman collection export must be placed in this folder.

Final file path:

```txt
Documentation/postman/stock-market-platform.postman_collection.json
```

## Required Folder Structure

```txt
Stock Market Platform
  Member Auth
  Members
  Admin Auth
  Admin Users
  Stocks
  Wallet
  Admin Withdrawals
  Orders
  Alerts
  Admin Members
  Analytics
```

## Current Completed Folders

```txt
Member Auth
Members
Admin Auth
Admin Users
Stocks
Wallet
Admin Withdrawals
Orders
```

## Required Examples

Every request should have:

```txt
1 success example
1 error example
```

## Requests To Include

### Member Auth

- Register Member
- Register With Referral
- Verify OTP
- Resend OTP
- Set Password
- Login
- Forgot Password
- Verify Reset OTP
- Reset Password

### Members

- Get Me
- Change Password

### Admin Auth

- Admin Login
- Admin Change Password

### Admin Users

- Create Admin User
- List Admin Users

### Stocks

- Create Stock
- List Stocks
- Get Stock By ID
- Get Stock History
- Update Stock
- Delist Stock

### Wallet

- Deposit
- Withdraw
- Get Balance
- List Transactions

### Admin Withdrawals

- List Withdrawals
- Approve Withdrawal
- Reject Withdrawal

### Orders

- Buy Stock
- Sell Stock
- Get Portfolio
- Get Order History

## How To Save Examples

1. Send the request.
2. Click `Save Response`.
3. Choose `Save as example`.
4. Name the example clearly.
5. Save it inside the correct request.

# Referral Schema

## Collection

```txt
referrals
```

## Purpose

Stores referral relationships between members.

## Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| referrerId | ObjectId | Yes | Member who owns referral code |
| referredMemberId | ObjectId | Yes | New referred member |
| referralCode | string | Yes | Referral code used |
| status | enum | Yes | Referral status |
| registeredAt | Date | No | Registration timestamp |
| emailVerifiedAt | Date | No | Email verification timestamp |
| rewardedAt | Date | No | Future reward timestamp |
| createdAt | Date | Yes | Created by timestamps |
| updatedAt | Date | Yes | Updated by timestamps |

## Enums

status: registered | email_verified | rewarded | cancelled

## Indexes

referrerId + createdAt, referredMemberId unique, referralCode, status

## Example Document

```json
{"referralCode":"ADAM123456","status":"email_verified"}
```

## Design Notes

Referral tracking is stored separately from members so one member can refer many other members.

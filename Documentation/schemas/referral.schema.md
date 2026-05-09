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
| referrerId | ObjectId | Yes | Member who owns code |
| referredMemberId | ObjectId | Yes | Referred member |
| referralCode | string | Yes | Code used |
| status | enum | Yes | Referral status |
| registeredAt | Date | No | Registration time |
| emailVerifiedAt | Date | No | Email verification time |
| rewardedAt | Date | No | Future reward time |

## Enums

status: registered | email_verified | rewarded | cancelled

## Indexes

referrerId + createdAt, referredMemberId unique, status

## Example Document

```json
{"referralCode":"JOHN123456","status":"email_verified"}
```

## Design Notes

Separate collection supports one referrer to many referred members.

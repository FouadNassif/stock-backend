export const SchedulerJobName = {
  NegativeBalanceCheck: 'negative-balance-check',
  StalePendingWithdrawalsCheck: 'stale-pending-withdrawals-check',
} as const;

export type SchedulerJobName =
  (typeof SchedulerJobName)[keyof typeof SchedulerJobName];

export const SchedulerJobEnabled = {
  negativeBalanceCheck: true,
  stalePendingWithdrawalsCheck: true,
} as const;

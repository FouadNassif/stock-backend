export const SchedulerJobName = {
    NegativeBalanceCheck: 'negative-balance-check',
} as const;

export type SchedulerJobName = (typeof SchedulerJobName)[keyof typeof SchedulerJobName];

export const SchedulerJobEnabled = {
    negativeBalanceCheck: true,
} as const;
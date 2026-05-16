import { Module } from '@nestjs/common';

import { SystemAlertsModule } from '../system-alerts/system-alerts.module';
import { NegativeBalanceJob } from './jobs/negative-balance.job';
import { StalePendingWithdrawalsJob } from './jobs/stale-pending-withdrawals.job';

@Module({
    imports: [SystemAlertsModule],
    providers: [
        NegativeBalanceJob,
        StalePendingWithdrawalsJob,
    ],
})
export class SchedulerJobsModule { }
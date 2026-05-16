import { Module } from '@nestjs/common';

import { SystemAlertsModule } from '../system-alerts/system-alerts.module';
import { NegativeBalanceJob } from './jobs/negative-balance.job';

@Module({
    imports: [SystemAlertsModule],
    providers: [NegativeBalanceJob],
})
export class SchedulerJobsModule { }
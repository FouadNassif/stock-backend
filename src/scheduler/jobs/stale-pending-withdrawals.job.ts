import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { SystemAlertsService } from '../../system-alerts/system-alerts.service';
import {
    SchedulerJobEnabled,
    SchedulerJobName,
} from '../scheduler.config';

@Injectable()
export class StalePendingWithdrawalsJob {
    private readonly logger = new Logger(StalePendingWithdrawalsJob.name);

    constructor(
        private readonly systemAlertsService: SystemAlertsService,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_9AM, {
        name: SchedulerJobName.StalePendingWithdrawalsCheck,
    })
    async handleCron(): Promise<void> {
        if (!SchedulerJobEnabled.stalePendingWithdrawalsCheck) {
            this.logger.log('Stale pending withdrawals cron is disabled');
            return;
        }

        this.logger.log('Starting stale pending withdrawals check');

        await this.systemAlertsService.runStalePendingWithdrawalsCheckFromScheduler();

        this.logger.log('Stale pending withdrawals check completed');
    }
}
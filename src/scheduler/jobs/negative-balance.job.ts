import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { SystemAlertsService } from '../../system-alerts/system-alerts.service';
import { SchedulerJobEnabled, SchedulerJobName } from '../scheduler.config';

@Injectable()
export class NegativeBalanceJob {
  private readonly logger = new Logger(NegativeBalanceJob.name);

  constructor(private readonly systemAlertsService: SystemAlertsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: SchedulerJobName.NegativeBalanceCheck,
  })
  async handleCron(): Promise<void> {
    if (!SchedulerJobEnabled.negativeBalanceCheck) {
      this.logger.log('Negative balance cron is disabled');
      return;
    }

    this.logger.log('Starting negative balance check');

    await this.systemAlertsService.runNegativeBalanceCheckFromScheduler();

    this.logger.log('Negative balance check completed');
  }
}

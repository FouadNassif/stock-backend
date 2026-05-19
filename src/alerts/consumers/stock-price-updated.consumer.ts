import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import { NotificationEventType } from '../../messaging/types/notification-event.type';
import type { StockPriceUpdatedPayload } from '../../messaging/types/notification-event.type';
import { AlertsService } from '../alerts.service';

@Controller()
export class StockPriceUpdatedConsumer {
  private readonly logger = new Logger(StockPriceUpdatedConsumer.name);

  constructor(private readonly alertsService: AlertsService) {}

  @EventPattern(NotificationEventType.StockPriceUpdated)
  async handleStockPriceUpdated(
    @Payload() payload: StockPriceUpdatedPayload,
  ): Promise<void> {
    this.logger.log(
      `Checking price alerts for ${payload.ticker} at ${payload.currentPrice}`,
    );

    await this.alertsService.checkAndTriggerAlertsForStock(payload.stockId);
  }
}

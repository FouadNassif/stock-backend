import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import { NotificationEventType } from '../messaging/types/notification-event.type';
import type { PriceAlertTriggeredPayload } from '../messaging/types/notification-event.type';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationEventsConsumer {
    constructor(private readonly notificationsService: NotificationsService) { }

    @EventPattern(NotificationEventType.PriceAlertTriggered)
    async handlePriceAlertTriggered(
        @Payload() payload: PriceAlertTriggeredPayload,
    ): Promise<void> {
        await this.notificationsService.sendPriceAlertEmail({
            email: payload.email,
            fullName: payload.fullName,
            ticker: payload.ticker,
            companyName: payload.companyName,
            targetPrice: payload.targetPrice,
            currentPrice: payload.currentPrice,
            direction: payload.direction,
        });
    }
}
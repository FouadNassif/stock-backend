import { Module } from '@nestjs/common';

import { NotificationsService } from './notifications.service';
import { NotificationEventsConsumer } from './notification-events.consumer';

@Module({
  controllers: [NotificationEventsConsumer],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

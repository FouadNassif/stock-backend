import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

import {
  RABBITMQ_NOTIFICATION_CLIENT,
  RABBITMQ_REALTIME_CLIENT,
} from './constants/messaging.constants';
import {
  NotificationEvent,
  NotificationEventType,
} from './types/notification-event.type';
import { RealtimeEvent, RealtimeEventType } from './types/realtime-event.type';

@Injectable()
export class MessagingService {
  constructor(
    @Inject(RABBITMQ_NOTIFICATION_CLIENT)
    private readonly notificationClient: ClientProxy,

    @Inject(RABBITMQ_REALTIME_CLIENT)
    private readonly realtimeClient: ClientProxy,
  ) {}

  async publishNotification<T extends NotificationEventType>(
    event: NotificationEvent<T>,
  ): Promise<void> {
    await lastValueFrom(
      this.notificationClient.emit(event.type, event.payload),
    );
  }

  async publishRealtime<T extends RealtimeEventType>(
    event: RealtimeEvent<T>,
  ): Promise<void> {
    await lastValueFrom(this.realtimeClient.emit(event.type, event.payload));
  }
}

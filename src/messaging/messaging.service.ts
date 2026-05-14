import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

import { RABBITMQ_NOTIFICATION_CLIENT } from './constants/messaging.constants';
import {
    NotificationEvent,
    NotificationEventType,
} from './types/notification-event.type';

@Injectable()
export class MessagingService {
    constructor(
        @Inject(RABBITMQ_NOTIFICATION_CLIENT)
        private readonly notificationClient: ClientProxy,
    ) { }

    async publishNotification<T extends NotificationEventType>(
        event: NotificationEvent<T>,
    ): Promise<void> {
        await lastValueFrom(
            this.notificationClient.emit(event.type, event.payload),
        );
    }
}
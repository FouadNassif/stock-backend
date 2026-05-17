import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import {
  RABBITMQ_NOTIFICATION_CLIENT,
  RABBITMQ_REALTIME_CLIENT,
} from './constants/messaging.constants';
import { MessagingService } from './messaging.service';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: RABBITMQ_NOTIFICATION_CLIENT,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
            queue: configService.getOrThrow<string>(
              'RABBITMQ_NOTIFICATION_QUEUE',
            ),
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
      {
        name: RABBITMQ_REALTIME_CLIENT,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
            queue: configService.getOrThrow<string>('RABBITMQ_REALTIME_QUEUE'),
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
    ]),
  ],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule { }
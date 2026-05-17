import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from './auth/auth.module';
import { MembersModule } from './members/members.module';
import { NotificationsModule } from './notifications/notifications.module';
import { envValidationSchema } from './config/env.validation';
import { ReferralsModule } from './referrals/referrals.module';
import { AdminModule } from './admin/admin.module';
import { StocksModule } from './stocks/stocks.module';
import { WalletModule } from './wallet/wallet.module';
import { OrdersModule } from './orders/orders.module';
import { RedisModule } from './common/redis/redis.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { PaymentsModule } from './payments/payments.module';
import { MessagingModule } from './messaging/messaging.module';
import { AlertsController } from './alerts/alerts.controller';
import { AlertsModule } from './alerts/alerts.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SystemAlertsModule } from './system-alerts/system-alerts.module';
import { SchedulerJobsModule } from './scheduler/scheduler.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGO_URI'),
      }),
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    AuthModule,
    MembersModule,
    NotificationsModule,
    ReferralsModule,
    AdminModule,
    StocksModule,
    WalletModule,
    OrdersModule,
    AuditLogsModule,
    PaymentsModule,
    MessagingModule,
    AlertsModule,
    RealtimeModule,
    SystemAlertsModule,
    SchedulerJobsModule,
    AnalyticsModule,
  ],
  controllers: [AlertsController],
})
export class AppModule {}

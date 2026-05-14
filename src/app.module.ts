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
import { AuditLogsService } from './audit-logs/audit-logs.service';
import { PaymentsModule } from './payments/payments.module';

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
  ],
})
export class AppModule { }
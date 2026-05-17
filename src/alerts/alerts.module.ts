import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Member, MemberSchema } from '../members/schemas/member.schema';
import { MessagingModule } from '../messaging/messaging.module';
import { Stock, StockSchema } from '../stocks/schemas/stock.schema';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { PriceAlert, PriceAlertSchema } from './schemas/price-alert.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PriceAlert.name,
        schema: PriceAlertSchema,
      },
      {
        name: Member.name,
        schema: MemberSchema,
      },
      {
        name: Stock.name,
        schema: StockSchema,
      },
    ]),
    MessagingModule,
  ],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}

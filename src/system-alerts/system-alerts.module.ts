import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Member, MemberSchema } from '../members/schemas/member.schema';
import {
  Transaction,
  TransactionSchema,
} from '../wallet/schemas/transaction.schema';
import {
  NegativeBalanceAlert,
  NegativeBalanceAlertSchema,
} from './schemas/negative-balance-alert.schema';
import {
  StalePendingWithdrawalAlert,
  StalePendingWithdrawalAlertSchema,
} from './schemas/stale-pending-withdrawal-alert.schema';
import { SystemAlertsController } from './system-alerts.controller';
import { SystemAlertsService } from './system-alerts.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Member.name,
        schema: MemberSchema,
      },
      {
        name: Transaction.name,
        schema: TransactionSchema,
      },
      {
        name: NegativeBalanceAlert.name,
        schema: NegativeBalanceAlertSchema,
      },
      {
        name: StalePendingWithdrawalAlert.name,
        schema: StalePendingWithdrawalAlertSchema,
      },
    ]),
  ],
  controllers: [SystemAlertsController],
  providers: [SystemAlertsService],
  exports: [SystemAlertsService],
})
export class SystemAlertsModule {}

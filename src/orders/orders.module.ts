import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import {
  Transaction,
  TransactionSchema,
} from '../wallet/schemas/transaction.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { Stock, StockSchema } from '../stocks/schemas/stock.schema';
import { Order, OrderSchema } from './schemas/order.schema';
import { Position, PositionSchema } from './schemas/position.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Order.name,
        schema: OrderSchema,
      },
      {
        name: Position.name,
        schema: PositionSchema,
      },
      {
        name: Transaction.name,
        schema: TransactionSchema,
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
    NotificationsModule,
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService, MongooseModule],
})
export class OrdersModule {}

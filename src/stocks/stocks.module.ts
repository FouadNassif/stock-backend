import { Module } from '@nestjs/common';
import { StocksController } from './stocks.controller'
import { MongooseModule } from '@nestjs/mongoose';
import { StocksService } from './stocks.service';
import { Stock, StockSchema } from './schemas/stock.schema';
import { PriceHistory, PriceHistorySchema } from './schemas/price-history.schema';
import { AlertsModule } from 'src/alerts/alerts.module';

@Module({
  imports: [
    AlertsModule,
    MongooseModule.forFeature([
      {
        name: Stock.name,
        schema: StockSchema,
      },
      {
        name: PriceHistory.name,
        schema: PriceHistorySchema,
      }
    ]),
  ],
  controllers: [StocksController],
  providers: [StocksService]
})
export class StocksModule { }

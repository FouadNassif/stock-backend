import { PriceAlertDocument } from '../schemas/price-alert.schema';
import { PriceAlertResponse } from '../types/price-alert-response.type';

type PopulatedStock = {
  _id: {
    toString(): string;
  };
  ticker: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  isListed: boolean;
};

export function toPriceAlertResponse(
  alert: PriceAlertDocument,
): PriceAlertResponse {
  const possibleStock = alert.stockId as unknown as PopulatedStock;

  const stock =
    possibleStock &&
    typeof possibleStock === 'object' &&
    'ticker' in possibleStock
      ? {
          id: possibleStock._id.toString(),
          ticker: possibleStock.ticker,
          companyName: possibleStock.companyName,
          sector: possibleStock.sector,
          currentPrice: possibleStock.currentPrice,
          isListed: possibleStock.isListed,
        }
      : undefined;

  return {
    id: alert._id.toString(),
    memberId: alert.memberId.toString(),
    stockId: stock?.id ?? alert.stockId.toString(),
    targetPrice: alert.targetPrice,
    direction: alert.direction,
    triggered: alert.triggered,
    triggeredAt: alert.triggeredAt,
    createdAt: alert.createdAt,
    updatedAt: alert.updatedAt,
    stock,
  };
}

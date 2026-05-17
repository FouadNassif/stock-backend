export enum RealtimeEventType {
  PortfolioUpdated = 'portfolio.updated',
}

export type PortfolioUpdatedPayload = {
  memberId: string;
  walletBalance: number;
  orderId?: string;
  orderType?: 'buy' | 'sell';
  realizedProfitLoss?: number;
  totalPositions?: number;
  totalInvestedValue?: number;
  totalCurrentValue?: number;
  totalUnrealizedProfitLoss?: number;
};

export type RealtimeEventPayloadMap = {
  [RealtimeEventType.PortfolioUpdated]: PortfolioUpdatedPayload;
};

export type RealtimeEvent<T extends RealtimeEventType = RealtimeEventType> = {
  type: T;
  payload: RealtimeEventPayloadMap[T];
};

import { PriceAlertDirection } from '../schemas/price-alert.schema';

export type PriceAlertResponse = {
    id: string;
    memberId: string;
    stockId: string;
    targetPrice: number;
    direction: PriceAlertDirection;
    triggered: boolean;
    triggeredAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    stock?: {
        id: string;
        ticker: string;
        companyName: string;
        sector: string;
        currentPrice: number;
        isListed: boolean;
    };
};
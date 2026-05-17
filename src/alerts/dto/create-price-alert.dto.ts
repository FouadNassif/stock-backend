import { IsEnum, IsMongoId, IsNumber, Min } from 'class-validator';

import { PriceAlertDirection } from '../schemas/price-alert.schema';

export class CreatePriceAlertDto {
    @IsMongoId()
    stockId!: string;

    @IsNumber()
    @Min(0.01)
    targetPrice!: number;

    @IsEnum(PriceAlertDirection)
    direction!: PriceAlertDirection;
}
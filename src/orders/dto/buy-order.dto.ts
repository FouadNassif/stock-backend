import { IsMongoId, IsNumber, Min } from 'class-validator';

export class BuyOrderDto {
    @IsMongoId()
    stockId!: string;

    @IsNumber()
    @Min(1)
    quantity!: number;
}
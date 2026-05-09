import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateStockDto {
    @IsString()
    ticker!: string;

    @IsString()
    companyName!: string;

    @IsString()
    sector!: string;

    @IsNumber()
    @Min(0)
    currentPrice!: number;

    @IsOptional()
    @IsString()
    description?: string;
}
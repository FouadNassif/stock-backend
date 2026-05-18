import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateStockDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentPrice?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

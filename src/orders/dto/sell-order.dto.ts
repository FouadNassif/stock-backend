import { IsMongoId, IsNumber, Min } from 'class-validator';

export class SellOrderDto {
  @IsMongoId()
  stockId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;
}

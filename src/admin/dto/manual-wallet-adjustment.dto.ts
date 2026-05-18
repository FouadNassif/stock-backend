import { IsNotEmpty, IsEnum, IsNumber, IsString, Min } from 'class-validator';

export enum WalletAdjustmentType {
  Credit = 'credit',
  Debit = 'debit',
}

export class ManualWalletAdjustmentDto {
  @IsEnum(WalletAdjustmentType)
  type!: WalletAdjustmentType;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}

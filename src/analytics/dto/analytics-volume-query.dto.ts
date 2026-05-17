import { IsDateString, IsEnum, IsMongoId } from 'class-validator';

export enum AnalyticsGranularity {
  Day = 'day',
  Month = 'month',
}

export class AnalyticsVolumeQueryDto {
  @IsMongoId()
  stock_id!: string;

  @IsEnum(AnalyticsGranularity)
  granularity!: AnalyticsGranularity;

  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;
}

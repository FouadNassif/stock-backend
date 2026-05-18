import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ActiveMembersQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(365)
  days: number = 30;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}

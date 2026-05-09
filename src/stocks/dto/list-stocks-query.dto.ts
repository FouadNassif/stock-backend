import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListStocksQueryDto {
    @IsOptional()
    @IsString()
    sector?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') {
            return true;
        }

        if (value === 'false') {
            return false;
        }
        return value;
    })
    @IsBoolean()
    isListed?: boolean;

    @IsOptional()
    @IsNumber()
    currentPrice?: number;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 10;
}
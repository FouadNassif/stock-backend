import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListStocksQueryDto {
    @IsOptional()
    @IsString()
    sector?: string;

    @IsOptional()
    @Transform(({ value }: { value: unknown }) => {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }

        if (value === 'true' || value === true) {
            return true;
        }

        if (value === 'false' || value === false) {
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

    @IsOptional()
    @Transform(({ value }) => value === '1' || value === 'true' || value === true)
    @IsBoolean()
    clear?: boolean;
}
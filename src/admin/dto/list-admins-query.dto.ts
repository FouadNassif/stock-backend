import { Transform } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

import { AdminRole } from '../schemas/admin.schema';

export class ListAdminsQueryDto {
    @IsOptional()
    @IsEnum(AdminRole)
    role?: AdminRole;

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
    isActive?: boolean;

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
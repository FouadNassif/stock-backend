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

import { IdentityStatus } from '../../members/schemas/member.schema';

export class ListMembersQueryDto {
    @IsOptional()
    @IsEnum(IdentityStatus)
    identityStatus?: IdentityStatus;

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
    emailVerified?: boolean;

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
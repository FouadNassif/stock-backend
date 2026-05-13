import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SuspendMemberDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    reason!: string;
}
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class MemberStatusDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

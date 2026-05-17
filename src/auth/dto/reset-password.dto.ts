import { IsString, MinLength } from 'class-validator';

import { Match } from '../../common/decorators/match.decorator';

export class ResetPasswordDto {
  @IsString()
  resetToken!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;

  @IsString()
  @MinLength(8)
  @Match('newPassword', {
    message: 'confirmPassword must match newPassword',
  })
  confirmPassword!: string;
}

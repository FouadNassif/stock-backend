import { IsJWT, IsString, MinLength } from 'class-validator';
import { Match } from 'src/common/decorators/match.decorator';

export class SetPasswordDto {
  @IsJWT()
  setupPasswordToken!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(8)
  @Match('password', {
    message: 'confirmPassword must match newPassword',
  })
  confirmPassword!: string;
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { MembersService } from '../../members/members.service';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly membersService: MembersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const member = await this.membersService.findById(payload.sub);

    if (!member || !member.isActive) {
      throw new UnauthorizedException('Invalid or inactive member account');
    }

    return payload;
  }
}

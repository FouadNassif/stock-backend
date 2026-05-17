import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Model } from 'mongoose';

import { Admin, AdminDocument } from '../schemas/admin.schema';
import { AdminJwtPayload } from '../types/admin-jwt-payload.type';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    private readonly configService: ConfigService,

    @InjectModel(Admin.name)
    private readonly adminModel: Model<AdminDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: AdminJwtPayload): Promise<AdminJwtPayload> {
    if (payload.type !== 'admin') {
      throw new UnauthorizedException('Invalid admin token');
    }

    const adminUser = await this.adminModel.findById(payload.sub).exec();

    if (!adminUser || !adminUser.isActive) {
      throw new UnauthorizedException('Invalid or inactive admin account');
    }

    return payload;
  }
}

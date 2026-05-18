import type { SignOptions } from 'jsonwebtoken';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { ReferralsModule } from '../referrals/referrals.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Otp, OtpSchema } from './schemas/otp.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MembersModule } from '../members/members.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Admin, AdminSchema } from '../admin/schemas/admin.schema';

@Module({
  imports: [
    MembersModule,
    NotificationsModule,
    ReferralsModule,
    PassportModule,

    MongooseModule.forFeature([
      {
        name: Otp.name,
        schema: OtpSchema,
      },
      {
        name: Admin.name,
        schema: AdminSchema,
      },
    ]),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.getOrThrow<string>(
          'JWT_EXPIRES_IN',
        ) as SignOptions['expiresIn'];

        return {
          secret: configService.getOrThrow<string>('JWT_SECRET'),
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

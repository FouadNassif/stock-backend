import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { MessagingModule } from '../messaging/messaging.module';
import { RealtimeEventsConsumer } from './consumers/realtime-events.consumer';
import { PortfolioGateway } from './gateways/portfolio.gateway';

@Module({
    imports: [
        MessagingModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.getOrThrow<string>('JWT_SECRET'),
            }),
        }),
    ],
    providers: [PortfolioGateway],
    controllers: [RealtimeEventsConsumer],
    exports: [PortfolioGateway],
})
export class RealtimeModule { }
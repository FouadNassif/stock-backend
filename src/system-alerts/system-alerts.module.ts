import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Member, MemberSchema } from '../members/schemas/member.schema';
import { NegativeBalanceAlert, NegativeBalanceAlertSchema } from './schemas/negative-balance-alert.schema';
import { SystemAlertsController } from './system-alerts.controller';
import { SystemAlertsService } from './system-alerts.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: Member.name,
                schema: MemberSchema,
            },
            {
                name: NegativeBalanceAlert.name,
                schema: NegativeBalanceAlertSchema,
            },
        ]),
    ],
    controllers: [SystemAlertsController],
    providers: [SystemAlertsService],
    exports: [SystemAlertsService],
})
export class SystemAlertsModule { }
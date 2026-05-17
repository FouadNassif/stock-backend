import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Member, MemberSchema } from './schemas/member.schema';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Member.name,
        schema: MemberSchema,
      },
    ]),
  ],
  providers: [MembersService],
  exports: [MembersService, MongooseModule],
  controllers: [MembersController],
})
export class MembersModule {}

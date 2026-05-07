import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Member, MemberDocument } from './schemas/member.schema';

@Injectable()
export class MembersService {
    constructor(
        @InjectModel(Member.name)
        private readonly memberModel: Model<MemberDocument>,
    ) { }

    async findByEmail(email: string): Promise<MemberDocument | null> {
        return this.memberModel.findOne({ email: email.toLowerCase() }).exec();
    }

    async findById(id: string): Promise<MemberDocument | null> {
        return this.memberModel.findById(id).exec();
    }
}
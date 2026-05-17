import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { MemberProfileResponse, MembersService } from './members.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { CurrentMember } from 'src/auth/decorators/current-member.decorator';
import { ChangeMemberPasswordDto } from './dto/change-password.dto';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(
    @CurrentMember() currentMember: JwtPayload,
  ): Promise<MemberProfileResponse> {
    return this.membersService.getMe(currentMember.sub);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentMember() currentMember: JwtPayload,
    @Body() dto: ChangeMemberPasswordDto,
  ): Promise<{ message: string }> {
    return this.membersService.changePassword(currentMember.sub, dto);
  }
}

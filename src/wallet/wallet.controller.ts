import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';

import { CurrentMember } from '../auth/decorators/current-member.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { DepositDto } from './dto/deposit.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { WalletService } from './wallet.service';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Post('deposit')
    deposit(@CurrentMember() currentMember: JwtPayload, @Body() dto: DepositDto) {
        return this.walletService.deposit(currentMember.sub, dto);
    }

    @Post('withdraw')
    withdraw(@CurrentMember() currentMember: JwtPayload, @Body() dto: WithdrawDto) {
        return this.walletService.withdraw(currentMember.sub, dto);
    }

    @Get('balance')
    getBalance(@CurrentMember() currentMember: JwtPayload) {
        return this.walletService.getBalance(currentMember.sub);
    }

    @Get('transactions')
    listTransactions(@CurrentMember() currentMember: JwtPayload, @Query() query: ListTransactionsQueryDto) {
        return this.walletService.listTransactions(currentMember.sub, query);
    }
}
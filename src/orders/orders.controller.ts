import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentMember } from '../auth/decorators/current-member.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { OrdersService } from './orders.service';
import { BuyOrderDto } from './dto/buy-order.dto';
import { SellOrderDto } from './dto/sell-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(private readonly orderService: OrdersService) { }

    @Post('buy')
    buyStock(@CurrentMember() currentMember: JwtPayload, @Body() dto: BuyOrderDto) {
        return this.orderService.buyStock(currentMember.sub, dto);
    }

    @Post('sell')
    sellStock(@CurrentMember() currentMember: JwtPayload, @Body() dto: SellOrderDto) {
        return this.orderService.sellStock(currentMember.sub, dto);
    }
    @Get('portfolio')
    getPortfolio(@CurrentMember() currentMember: JwtPayload, @Query('clear') clear?: string,
    ) {
        return this.orderService.getPortfolio(currentMember.sub, clear === '1' || clear === 'true');
    }
    @Get('history')
    getOrderHistory(@CurrentMember() currentMember: JwtPayload, @Query() query: ListOrdersQueryDto) {
        return this.orderService.getOrderHistory(currentMember.sub, query);
    }
}
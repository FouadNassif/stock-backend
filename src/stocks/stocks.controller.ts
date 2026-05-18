import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { CurrentAdmin } from '../admin/decorators/current-admin.decorator';
import { AdminJwtAuthGuard } from '../admin/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRole } from '../admin/schemas/admin.schema';
import type { AdminJwtPayload } from '../admin/types/admin-jwt-payload.type';
import { CreateStockDto } from './dto/create-stock.dto';
import { ListStocksQueryDto } from './dto/list-stocks-query.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { StockResponse, StocksService } from './stocks.service';
import { ObjectIdPipe } from '../common/pipes/object-id.pipe';

@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) { }

  @Get()
  listStocks(@Query() query: ListStocksQueryDto) {
    return this.stocksService.listStocks(query);
  }

  @Get(':ticker')
  getStockById(
    @Param('ticker') ticker: string,
    @Query('clear') clear?: string,
  ) {
    return this.stocksService.getStockById(
      ticker,
      clear === '1' || clear === 'true',
    );
  }

  @Get(':ticker/history')
  getStockHistory(@Param('ticker') ticker: string) {
    return this.stocksService.getStockHistory(ticker);
  }

  @Post('/create')
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.Admin, AdminRole.Analyst)
  createStock(
    @CurrentAdmin() currentAdmin: AdminJwtPayload,
    @Body() dto: CreateStockDto,
  ): Promise<{
    message: string;
    stock: StockResponse;
  }> {
    return this.stocksService.createStock(currentAdmin.sub, dto);
  }

  @Patch(':id/update')
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.Admin, AdminRole.Analyst)
  updateStock(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentAdmin() currentAdmin: AdminJwtPayload,
    @Body() dto: UpdateStockDto,
  ) {
    return this.stocksService.updateStock(id, currentAdmin.sub, dto);
  }

  @Patch(':id/listed')
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.Admin, AdminRole.Analyst)
  listStock(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentAdmin() currentAdmin: AdminJwtPayload,
  ) {
    return this.stocksService.listStock(id, currentAdmin.sub);
  }

  @Patch(':id/delist')
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.Admin, AdminRole.Analyst)
  delistStock(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentAdmin() currentAdmin: AdminJwtPayload,
  ) {
    return this.stocksService.delistStock(id, currentAdmin.sub);
  }
}

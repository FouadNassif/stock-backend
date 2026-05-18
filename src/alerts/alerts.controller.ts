import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentMember } from '../auth/decorators/current-member.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { ObjectIdPipe } from '../common/pipes/object-id.pipe';
import { AlertsService } from './alerts.service';
import { CreatePriceAlertDto } from './dto/create-price-alert.dto';
import { ListPriceAlertsQueryDto } from './dto/list-price-alerts-query.dto';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  createAlert(
    @CurrentMember() currentMember: JwtPayload,
    @Body() dto: CreatePriceAlertDto,
  ) {
    return this.alertsService.createAlert(currentMember.sub, dto);
  }

  @Get()
  listAlerts(
    @CurrentMember() currentMember: JwtPayload,
    @Query() query: ListPriceAlertsQueryDto,
  ) {
    return this.alertsService.listAlerts(currentMember.sub, query);
  }

  @Delete(':id')
  deleteAlert(
    @CurrentMember() currentMember: JwtPayload,
    @Param('id', ObjectIdPipe) id: string,
  ) {
    return this.alertsService.deleteAlert(currentMember.sub, id);
  }
}

import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import { RealtimeEventType } from '../../messaging/types/realtime-event.type';
import type { PortfolioUpdatedPayload } from '../../messaging/types/realtime-event.type';
import { PortfolioGateway } from '../gateways/portfolio.gateway';

@Controller()
export class RealtimeEventsConsumer {
  constructor(private readonly portfolioGateway: PortfolioGateway) {}

  @EventPattern(RealtimeEventType.PortfolioUpdated)
  handlePortfolioUpdated(@Payload() payload: PortfolioUpdatedPayload): void {
    this.portfolioGateway.emitPortfolioUpdated(payload);
  }
}

import { BadRequestException, Controller, Headers, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('stripe/webhook')
    async handleStripeWebhook(
        @Req() request: RawBodyRequest<Request>,
        @Headers('stripe-signature') signature?: string,
    ): Promise<{ received: true }> {
        if (!signature) {
            throw new BadRequestException('Missing Stripe signature');
        }

        if (!request.rawBody) {
            throw new BadRequestException('Missing raw request body');
        }

        let event: ReturnType<PaymentsService['constructWebhookEvent']>;

        try {
            event = this.paymentsService.constructWebhookEvent(
                request.rawBody,
                signature,
            );
        } catch {
            throw new BadRequestException('Invalid Stripe webhook signature');
        }

        return this.paymentsService.handleWebhookEvent(event);
    }
}
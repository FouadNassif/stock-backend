import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { checkMemberEligibility } from '../common/utils/member.util';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { MessagingService } from '../messaging/messaging.service';
import { NotificationEventType } from '../messaging/types/notification-event.type';
import { Stock, StockDocument } from '../stocks/schemas/stock.schema';
import { CreatePriceAlertDto } from './dto/create-price-alert.dto';
import { ListPriceAlertsQueryDto } from './dto/list-price-alerts-query.dto';
import { toPriceAlertResponse } from './mappers/price-alert.mapper';
import {
    PriceAlert,
    PriceAlertDirection,
    PriceAlertDocument,
} from './schemas/price-alert.schema';
import { PriceAlertResponse } from './types/price-alert-response.type';

type PriceAlertFilter = {
    memberId: Types.ObjectId;
    stockId?: Types.ObjectId;
    direction?: PriceAlertDirection;
    triggered?: boolean;
};

@Injectable()
export class AlertsService {
    constructor(
        @InjectModel(PriceAlert.name)
        private readonly priceAlertModel: Model<PriceAlertDocument>,

        @InjectModel(Member.name)
        private readonly memberModel: Model<MemberDocument>,

        @InjectModel(Stock.name)
        private readonly stockModel: Model<StockDocument>,

        private readonly messagingService: MessagingService,
    ) { }

    async createAlert(
        currentMemberId: string,
        dto: CreatePriceAlertDto,
    ): Promise<{
        message: string;
        alert: PriceAlertResponse;
    }> {
        const member = await this.memberModel.findById(currentMemberId).exec();
        const eligibleMember = checkMemberEligibility(member, true);

        const stock = await this.stockModel.findById(dto.stockId).exec();

        if (!stock) {
            throw new NotFoundException('Stock not found');
        }

        if (!stock.isListed) {
            throw new BadRequestException('Cannot create alert for delisted stock');
        }

        const existingAlert = await this.priceAlertModel
            .findOne({
                memberId: eligibleMember._id,
                stockId: stock._id,
                targetPrice: dto.targetPrice,
                direction: dto.direction,
                triggered: false,
            })
            .exec();

        if (existingAlert) {
            throw new BadRequestException(
                'An active price alert with the same condition already exists',
            );
        }

        const alert = await this.priceAlertModel.create({
            memberId: eligibleMember._id,
            stockId: stock._id,
            targetPrice: dto.targetPrice,
            direction: dto.direction,
            triggered: false,
        });

        const populatedAlert = await alert.populate('stockId');

        return {
            message: 'Price alert created successfully',
            alert: toPriceAlertResponse(populatedAlert),
        };
    }

    async listAlerts(
        currentMemberId: string,
        query: ListPriceAlertsQueryDto,
    ): Promise<{
        data: PriceAlertResponse[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }> {
        const member = await this.memberModel.findById(currentMemberId).exec();
        const eligibleMember = checkMemberEligibility(member, true);

        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const filter: PriceAlertFilter = {
            memberId: eligibleMember._id,
        };

        if (query.stockId) {
            filter.stockId = new Types.ObjectId(query.stockId);
        }

        if (query.direction) {
            filter.direction = query.direction;
        }

        if (typeof query.triggered === 'boolean') {
            filter.triggered = query.triggered;
        }

        const [alerts, total] = await Promise.all([
            this.priceAlertModel
                .find(filter)
                .populate('stockId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),

            this.priceAlertModel.countDocuments(filter).exec(),
        ]);

        return {
            data: alerts.map((alert) => toPriceAlertResponse(alert)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async deleteAlert(
        currentMemberId: string,
        alertId: string,
    ): Promise<{ message: string }> {
        const member = await this.memberModel.findById(currentMemberId).exec();
        const eligibleMember = checkMemberEligibility(member, true);

        const alert = await this.priceAlertModel
            .findOne({
                _id: alertId,
                memberId: eligibleMember._id,
            })
            .exec();

        if (!alert) {
            throw new NotFoundException('Price alert not found');
        }

        await alert.deleteOne();

        return {
            message: 'Price alert deleted successfully',
        };
    }

    async checkAndTriggerAlertsForStock(stockId: string): Promise<void> {
        const stock = await this.stockModel.findById(stockId).exec();

        if (!stock) {
            return;
        }

        const activeAlerts = await this.priceAlertModel
            .find({
                stockId: stock._id,
                triggered: false,
            })
            .exec();

        for (const alert of activeAlerts) {
            const shouldTrigger = this.shouldTriggerAlert(
                stock.currentPrice,
                alert.targetPrice,
                alert.direction,
            );

            if (!shouldTrigger) {
                continue;
            }

            const updatedAlert = await this.priceAlertModel
                .findOneAndUpdate(
                    {
                        _id: alert._id,
                        triggered: false,
                    },
                    {
                        triggered: true,
                        triggeredAt: new Date(),
                    },
                    {
                        returnDocument: 'after',
                    },
                )
                .exec();

            if (!updatedAlert) {
                continue;
            }

            const member = await this.memberModel.findById(alert.memberId).exec();

            if (!member || !member.isActive || !member.emailVerified) {
                continue;
            }

            await this.messagingService.publishNotification({
                type: NotificationEventType.PriceAlertTriggered,
                payload: {
                    email: member.email,
                    fullName: member.fullName,
                    ticker: stock.ticker,
                    companyName: stock.companyName,
                    targetPrice: alert.targetPrice,
                    currentPrice: stock.currentPrice,
                    direction: alert.direction,
                },
            });
        }
    }

    private shouldTriggerAlert(
        currentPrice: number,
        targetPrice: number,
        direction: PriceAlertDirection,
    ): boolean {
        if (direction === PriceAlertDirection.Above) {
            return currentPrice >= targetPrice;
        }

        return currentPrice <= targetPrice;
    }
}
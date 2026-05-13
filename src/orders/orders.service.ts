import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Model, Connection, Types } from 'mongoose';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Order, OrderDocument, OrderStatus, OrderType } from './schemas/order.schema';
import { PositionDocument, PositionStatus } from './schemas/position.schema';
import { MemberDocument } from '../members/schemas/member.schema';
import { StockDocument } from '../stocks/schemas/stock.schema';
import { TransactionDocument } from '../wallet/schemas/transaction.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { checkMemberEligibility } from '../common/utils/member.util';
import { BuyOrderDto } from './dto/buy-order.dto';
import { SellOrderDto } from './dto/sell-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { TransactionStatus, TransactionType } from 'src/wallet/types/transaction.type';


type OrderResponse = {
    id: string;
    memberId: string;
    stockId: string;
    positionId: string;
    type: OrderType;
    quantity: number;
    priceAtExecution: number;
    totalAmount: number;
    status: OrderStatus;
    realizedProfitLoss: number;
    createdAt?: Date;
    updatedAt?: Date;
};

type PositionResponse = {
    id: string;
    memberId: string;
    stockId: string;
    sharesHeld: number;
    avgPurchasePrice: number;
    status: PositionStatus;
    openedAt: Date;
    closedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
};

type PortfolioPositionResponse = {
    positionId: string;
    stock: {
        id: string;
        ticker: string;
        companyName: string;
        sector: string;
        currentPrice: number;
        isListed: boolean;
    };
    sharesHeld: number;
    avgPurchasePrice: number;
    investedValue: number;
    currentValue: number;
    unrealizedProfitLoss: number;
    openedAt: Date;
};

type PortfolioResponse = {
    positions: PortfolioPositionResponse[];
    summary: {
        totalPositions: number;
        totalInvestedValue: number;
        totalCurrentValue: number;
        totalUnrealizedProfitLoss: number;
    };
};

type OrderHistoryItemResponse = {
    id: string;
    type: OrderType;
    quantity: number;
    priceAtExecution: number;
    totalAmount: number;
    status: OrderStatus;
    realizedProfitLoss: number;
    createdAt?: Date;
    updatedAt?: Date;
    stock: {
        id: string;
        ticker: string;
        companyName: string;
        sector: string;
        currentPrice: number;
        isListed: boolean;
    };
};

type OrderHistoryFilter = {
    memberId: Types.ObjectId;
    type?: OrderType;
    status?: OrderStatus;
    createdAt?: {
        $gte?: Date;
        $lte?: Date;
    };
};

@Injectable()
export class OrdersService {
    constructor(
        @InjectConnection()
        private readonly connection: Connection,
        @InjectModel(Order.name)
        private readonly orderModel: Model<OrderDocument>,
        @InjectModel('Position')
        private readonly positionModel: Model<PositionDocument>,
        @InjectModel('Member')
        private readonly memberModel: Model<MemberDocument>,
        @InjectModel('Stock')
        private readonly stockModel: Model<StockDocument>,
        @InjectModel('Transaction')
        private readonly transactionModel: Model<TransactionDocument>,
        private readonly notificationsService: NotificationsService,
    ) { }

    async buyStock(
        currentMemberId: string,
        dto: BuyOrderDto,
    ): Promise<{
        message: string;
        walletBalance: number;
        order: OrderResponse;
        position: PositionResponse;
    }> {
        const session = await this.connection.startSession();

        let response!: {
            message: string;
            walletBalance: number;
            order: OrderResponse;
            position: PositionResponse;
        };

        let emailPayload!: {
            email: string;
            fullName: string;
            type: 'buy';
            ticker: string;
            companyName: string;
            quantity: number;
            priceAtExecution: number;
            totalAmount: number;
            walletBalance: number;
            realizedProfitLoss: number;
        };

        try {
            await session.withTransaction(async () => {
                const member = await this.memberModel.findById(currentMemberId).session(session).exec();

                const eligibleMember = checkMemberEligibility(member, true);

                const stock = await this.stockModel.findById(dto.stockId).session(session).exec();

                if (!stock) {
                    throw new NotFoundException('Stock not found');
                }

                if (!stock.isListed) {
                    throw new BadRequestException('Stock is not currently listed for trading');
                }

                const priceAtExecution = stock.currentPrice;
                const totalAmount = priceAtExecution * dto.quantity;

                if (eligibleMember.walletBalance < totalAmount) {
                    throw new BadRequestException('Insufficient wallet balance');
                }

                let position = await this.positionModel.findOne({
                    memberId: eligibleMember._id,
                    stockId: stock._id,
                    status: PositionStatus.Open,
                }).session(session).exec();

                if (position) {
                    const oldTotalCost = position.sharesHeld * position.avgPurchasePrice;

                    const newBuyCost = dto.quantity * priceAtExecution;

                    const newShares = position.sharesHeld + dto.quantity;

                    position.avgPurchasePrice = (oldTotalCost + newBuyCost) / newShares;

                    position.sharesHeld = newShares;

                    await position.save({ session });
                } else {
                    const createdPositions = await this.positionModel.create(
                        [
                            {
                                memberId: eligibleMember._id,
                                stockId: stock._id,
                                sharesHeld: dto.quantity,
                                avgPurchasePrice: priceAtExecution,
                                status: PositionStatus.Open,
                                openedAt: new Date(),
                            },
                        ],
                        { session },
                    );
                    position = createdPositions[0];
                }

                const balanceBefore = eligibleMember.walletBalance;
                const balanceAfter = balanceBefore - totalAmount;

                eligibleMember.walletBalance = balanceAfter;
                await eligibleMember.save({ session });

                const createdOrders = await this.orderModel.create(
                    [
                        {
                            memberId: eligibleMember._id,
                            stockId: stock._id,
                            positionId: position._id,
                            type: OrderType.Buy,
                            quantity: dto.quantity,
                            priceAtExecution,
                            totalAmount,
                            status: OrderStatus.Completed,
                            realizedProfitLoss: 0,
                        },
                    ],
                    { session },
                );

                const order = createdOrders[0];

                await this.transactionModel.create(
                    [
                        {
                            memberId: eligibleMember._id,
                            type: TransactionType.Buy,
                            amount: totalAmount,
                            status: TransactionStatus.Completed,
                            referenceId: order._id.toString(),
                            notes: `Bought ${dto.quantity} shares of ${stock.ticker} at $${priceAtExecution}.`,
                            balanceBefore,
                            balanceAfter,
                            processedAt: new Date(),
                        },
                    ],
                    { session },
                );

                response = {
                    message: 'Buy order completed successfully',
                    walletBalance: eligibleMember.walletBalance,
                    order: this.toOrderResponse(order),
                    position: this.toPositionResponse(position),
                };

                emailPayload = {
                    email: eligibleMember.email,
                    fullName: eligibleMember.fullName,
                    type: 'buy',
                    ticker: stock.ticker,
                    companyName: stock.companyName,
                    quantity: dto.quantity,
                    priceAtExecution,
                    totalAmount,
                    walletBalance: eligibleMember.walletBalance,
                    realizedProfitLoss: 0,
                };
            });
        } finally {
            await session.endSession();
        }

        await this.notificationsService.sendTradeConfirmationEmail(emailPayload);

        return response;
    }

    async sellStock(
        currentMemberId: string,
        dto: SellOrderDto,
    ): Promise<{
        message: string;
        walletBalance: number;
        order: OrderResponse;
        position: PositionResponse;
    }> {
        const session = await this.connection.startSession();

        let response!: {
            message: string;
            walletBalance: number;
            order: OrderResponse;
            position: PositionResponse;
        };

        let emailPayload!: {
            email: string;
            fullName: string;
            type: 'sell';
            ticker: string;
            companyName: string;
            quantity: number;
            priceAtExecution: number;
            totalAmount: number;
            walletBalance: number;
            realizedProfitLoss: number;
        };

        try {
            await session.withTransaction(async () => {
                const member = await this.memberModel
                    .findById(currentMemberId)
                    .session(session)
                    .exec();

                const eligibleMember = checkMemberEligibility(member, true);

                const stock = await this.stockModel
                    .findById(dto.stockId)
                    .session(session)
                    .exec();

                if (!stock) {
                    throw new NotFoundException('Stock not found');
                }

                const position = await this.positionModel
                    .findOne({
                        memberId: eligibleMember._id,
                        stockId: stock._id,
                        status: PositionStatus.Open,
                    })
                    .session(session)
                    .exec();

                if (!position) {
                    throw new NotFoundException('No open position found for this stock');
                }

                if (position.sharesHeld < dto.quantity) {
                    throw new BadRequestException('Not enough shares held to sell');
                }

                const priceAtExecution = stock.currentPrice;
                const totalAmount = priceAtExecution * dto.quantity;

                const realizedProfitLoss =
                    (priceAtExecution - position.avgPurchasePrice) * dto.quantity;

                const balanceBefore = eligibleMember.walletBalance;
                const balanceAfter = balanceBefore + totalAmount;

                eligibleMember.walletBalance = balanceAfter;
                await eligibleMember.save({ session });

                position.sharesHeld -= dto.quantity;

                if (position.sharesHeld === 0) {
                    position.status = PositionStatus.Closed;
                    position.closedAt = new Date();
                }

                await position.save({ session });

                const createdOrders = await this.orderModel.create(
                    [
                        {
                            memberId: eligibleMember._id,
                            stockId: stock._id,
                            positionId: position._id,
                            type: OrderType.Sell,
                            quantity: dto.quantity,
                            priceAtExecution,
                            totalAmount,
                            status: OrderStatus.Completed,
                            realizedProfitLoss,
                        },
                    ],
                    { session },
                );

                const order = createdOrders[0];

                await this.transactionModel.create(
                    [
                        {
                            memberId: eligibleMember._id,
                            type: TransactionType.Sell,
                            amount: totalAmount,
                            status: TransactionStatus.Completed,
                            referenceId: order._id.toString(),
                            notes: `Sold ${dto.quantity} shares of ${stock.ticker} at $${priceAtExecution}. Realized P&L: $${realizedProfitLoss.toFixed(2)}.`,
                            balanceBefore,
                            balanceAfter,
                            processedAt: new Date(),
                        },
                    ],
                    { session },
                );

                response = {
                    message: 'Sell order completed successfully',
                    walletBalance: eligibleMember.walletBalance,
                    order: this.toOrderResponse(order),
                    position: this.toPositionResponse(position),
                };

                emailPayload = {
                    email: eligibleMember.email,
                    fullName: eligibleMember.fullName,
                    type: 'sell',
                    ticker: stock.ticker,
                    companyName: stock.companyName,
                    quantity: dto.quantity,
                    priceAtExecution,
                    totalAmount,
                    walletBalance: eligibleMember.walletBalance,
                    realizedProfitLoss,
                };
            });
        } finally {
            await session.endSession();
        }

        await this.notificationsService.sendTradeConfirmationEmail(emailPayload);

        return response;
    }

    async getPortfolio(currentMemberId: string): Promise<PortfolioResponse> {
        const member = await this.memberModel.findById(currentMemberId).exec();

        const eligibleMember = checkMemberEligibility(member);

        const positions = await this.positionModel
            .find({
                memberId: eligibleMember._id,
                status: PositionStatus.Open,
                sharesHeld: { $gt: 0 },
            })
            .populate('stockId')
            .sort({ createdAt: -1 })
            .exec();

        const portfolioPositions: PortfolioPositionResponse[] = positions.map(
            (position) => {
                const stock = position.stockId as unknown as StockDocument;

                const investedValue =
                    position.sharesHeld * position.avgPurchasePrice;

                const currentValue =
                    position.sharesHeld * stock.currentPrice;

                const unrealizedProfitLoss =
                    (stock.currentPrice - position.avgPurchasePrice) *
                    position.sharesHeld;

                return {
                    positionId: position._id.toString(),
                    stock: {
                        id: stock._id.toString(),
                        ticker: stock.ticker,
                        companyName: stock.companyName,
                        sector: stock.sector,
                        currentPrice: stock.currentPrice,
                        isListed: stock.isListed,
                    },
                    sharesHeld: position.sharesHeld,
                    avgPurchasePrice: position.avgPurchasePrice,
                    investedValue,
                    currentValue,
                    unrealizedProfitLoss,
                    openedAt: position.openedAt,
                };
            },
        );

        const summary = portfolioPositions.reduce(
            (acc, position) => {
                acc.totalInvestedValue += position.investedValue;
                acc.totalCurrentValue += position.currentValue;
                acc.totalUnrealizedProfitLoss += position.unrealizedProfitLoss;

                return acc;
            },
            {
                totalPositions: portfolioPositions.length,
                totalInvestedValue: 0,
                totalCurrentValue: 0,
                totalUnrealizedProfitLoss: 0,
            },
        );

        return {
            positions: portfolioPositions,
            summary,
        };
    }

    async getOrderHistory(
        currentMemberId: string,
        query: ListOrdersQueryDto,
    ): Promise<{
        data: OrderHistoryItemResponse[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }> {
        const member = await this.memberModel.findById(currentMemberId).exec();

        const eligibleMember = checkMemberEligibility(member);

        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const filter: OrderHistoryFilter = {
            memberId: eligibleMember._id,
        };

        if (query.type) {
            filter.type = query.type;
        }

        if (query.status) {
            filter.status = query.status;
        }

        if (query.from || query.to) {
            filter.createdAt = {};

            if (query.from) {
                filter.createdAt.$gte = new Date(query.from);
            }

            if (query.to) {
                filter.createdAt.$lte = new Date(query.to);
            }
        }

        const [orders, total] = await Promise.all([
            this.orderModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('stockId')
                .exec(),

            this.orderModel.countDocuments(filter).exec(),
        ]);

        const data: OrderHistoryItemResponse[] = orders.map((order) => {
            const stock = order.stockId as unknown as StockDocument;

            return {
                id: order._id.toString(),
                type: order.type,
                quantity: order.quantity,
                priceAtExecution: order.priceAtExecution,
                totalAmount: order.totalAmount,
                status: order.status,
                realizedProfitLoss: order.realizedProfitLoss,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                stock: {
                    id: stock._id.toString(),
                    ticker: stock.ticker,
                    companyName: stock.companyName,
                    sector: stock.sector,
                    currentPrice: stock.currentPrice,
                    isListed: stock.isListed,
                },
            };
        });

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    private toOrderResponse(order: OrderDocument): OrderResponse {
        return {
            id: order._id.toString(),
            memberId: order.memberId.toString(),
            stockId: order.stockId.toString(),
            positionId: order.positionId.toString(),
            type: order.type,
            quantity: order.quantity,
            priceAtExecution: order.priceAtExecution,
            totalAmount: order.totalAmount,
            status: order.status,
            realizedProfitLoss: order.realizedProfitLoss,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        };
    }

    private toPositionResponse(position: PositionDocument): PositionResponse {
        return {
            id: position._id.toString(),
            memberId: position.memberId.toString(),
            stockId: position.stockId.toString(),
            sharesHeld: position.sharesHeld,
            avgPurchasePrice: position.avgPurchasePrice,
            status: position.status,
            openedAt: position.openedAt,
            closedAt: position.closedAt,
            createdAt: position.createdAt,
            updatedAt: position.updatedAt,
        };
    }
}

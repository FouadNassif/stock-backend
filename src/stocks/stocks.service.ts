import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateStockDto } from './dto/create-stock.dto';
import { ListStocksQueryDto } from './dto/list-stocks-query.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { PriceHistory, PriceHistoryDocument } from './schemas/price-history.schema';
import { Stock, StockDocument } from './schemas/stock.schema';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { AuditActorType, AuditLogAction, AuditTargetType } from 'src/audit-logs/types/audit-log-action.type';
import { AlertsService } from 'src/alerts/alerts.service';

type StockFilter = {
    sector?: string;
    isListed?: boolean;
    $or?: {
        companyName?: RegExp;
        ticker?: RegExp;
        sector?: RegExp;
    }[];
};

export type StockResponse = {
    id: string;
    ticker: string;
    companyName: string;
    sector: string;
    currentPrice: number;
    description?: string;
    isListed: boolean;
    createdAt?: Date;
    updatedAt?: Date;
};

@Injectable()
export class StocksService {
    constructor(
        @InjectModel(Stock.name)
        private readonly stockModel: Model<StockDocument>,

        @InjectModel(PriceHistory.name)
        private readonly priceHistoryModel: Model<PriceHistoryDocument>,

        private readonly auditLogsService: AuditLogsService,

        private readonly alertsService: AlertsService,
    ) { }

    async createStock(
        currentAdminId: string,
        dto: CreateStockDto,
    ): Promise<{ message: string; stock: StockResponse }> {
        const normalizedTicker = dto.ticker.toUpperCase();

        const existingStock = await this.stockModel
            .findOne({ ticker: normalizedTicker })
            .exec();

        if (existingStock) {
            throw new ConflictException('Stock with this ticker already exists');
        }

        const stock = await this.stockModel.create({
            ticker: normalizedTicker,
            companyName: dto.companyName,
            description: dto.description,
            sector: dto.sector,
            currentPrice: dto.currentPrice,
            isListed: true,
        });

        await this.priceHistoryModel.create({
            stockId: stock._id,
            price: stock.currentPrice,
            recordedAt: new Date(),
        });

        await this.auditLogsService.create({
            actorId: currentAdminId,
            actorType: AuditActorType.Admin,
            action: AuditLogAction.StockCreated,
            targetType: AuditTargetType.Stock,
            targetId: stock._id.toString(),
            description: 'Stock created by admin/analyst',
            metadata: {
                ticker: stock.ticker,
                companyName: stock.companyName,
                sector: stock.sector,
                currentPrice: stock.currentPrice,
            },
        });

        return {
            message: 'Stock created successfully',
            stock: this.toStockResponse(stock),
        };
    }

    async listStocks(query: ListStocksQueryDto): Promise<{
        data: StockResponse[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const filter: StockFilter = {};

        if (query.sector) {
            filter.sector = query.sector;
        }

        if (typeof query.isListed === 'boolean') {
            filter.isListed = query.isListed;
        }

        if (query.search) {
            const searchRegex = new RegExp(query.search, 'i');

            filter.$or = [
                { companyName: searchRegex },
                { ticker: searchRegex },
                { sector: searchRegex },
            ];
        }

        const [stocks, total] = await Promise.all([
            this.stockModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),

            this.stockModel.countDocuments(filter).exec(),
        ]);

        return {
            data: stocks.map((stock) => this.toStockResponse(stock)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getStockById(ticker: string): Promise<StockResponse> {
        const stock = await this.stockModel.findOne({ ticker }).exec();

        if (!stock) {
            throw new NotFoundException('Stock not found');
        }

        return this.toStockResponse(stock);
    }

    async getStockHistory(ticker: string): Promise<{
        stock: StockResponse;
        history: {
            stockId: string;
            price: number;
            recordedAt: Date;
        }[];
    }> {

        const stock = await this.stockModel.findOne({ ticker }).exec();

        if (!stock) {
            throw new NotFoundException('Stock not found');
        }

        const history = await this.priceHistoryModel
            .find({ stockId: stock._id })
            .sort({ recordedAt: -1 })
            .exec();

        return {
            stock: this.toStockResponse(stock),
            history: history.map((item) => ({
                stockId: item.stockId.toString(),
                price: item.price,
                recordedAt: item.recordedAt,
            })),
        };
    }

    async updateStock(
        id: string,
        currentAdminId: string,
        dto: UpdateStockDto,
    ): Promise<{ message: string; stock: StockResponse }> {
        if (dto.companyName === undefined && dto.sector === undefined &&
            dto.currentPrice === undefined && dto.description === undefined) {
            throw new BadRequestException('No update data provided');
        }

        const stock = await this.stockModel.findById(id).exec();

        if (!stock) {
            throw new NotFoundException('Stock not found');
        }

        const previousValues = {
            companyName: stock.companyName,
            sector: stock.sector,
            currentPrice: stock.currentPrice,
            description: stock.description,
        };

        const changes: Record<string, { before?: unknown; after?: unknown }> = {};

        if (dto.companyName !== undefined && dto.companyName !== previousValues.companyName) {
            changes.companyName = {
                before: previousValues.companyName,
                after: dto.companyName,
            };

            stock.companyName = dto.companyName;
        }

        if (dto.sector !== undefined && dto.sector !== previousValues.sector) {
            changes.sector = {
                before: previousValues.sector,
                after: dto.sector,
            };

            stock.sector = dto.sector;
        }

        if (dto.description !== undefined && dto.description !== previousValues.description) {
            changes.description = {
                before: previousValues.description,
                after: dto.description,
            };

            stock.description = dto.description;
        }

        const newPrice = dto.currentPrice;

        const isPriceChanged = typeof newPrice === 'number' && newPrice !== previousValues.currentPrice;

        if (isPriceChanged) {
            changes.currentPrice = {
                before: previousValues.currentPrice,
                after: newPrice,
            };
            stock.currentPrice = newPrice;
        }

        if (Object.keys(changes).length === 0) {
            throw new BadRequestException('No stock fields were changed');
        }

        await stock.save();

        if (isPriceChanged) {
            await this.priceHistoryModel.create({
                stockId: stock._id,
                price: stock.currentPrice,
                recordedAt: new Date(),
            });

            await this.alertsService.checkAndTriggerAlertsForStock(stock._id.toString());
        }

        await this.auditLogsService.create({
            actorId: currentAdminId,
            actorType: AuditActorType.Admin,
            action: AuditLogAction.StockUpdated,
            targetType: AuditTargetType.Stock,
            targetId: stock._id.toString(),
            description: 'Stock updated by admin/analyst',
            changes,
            metadata: {
                ticker: stock.ticker,
                companyName: stock.companyName,
            },
        });

        return {
            message: 'Stock updated successfully',
            stock: this.toStockResponse(stock),
        };
    }

    async delistStock(id: string, currentAdminId: string): Promise<{
        message: string;
        stock: StockResponse;
    }> {

        const stock = await this.stockModel.findById(id).exec();

        if (!stock) {
            throw new NotFoundException('Stock not found');
        }
        if (stock.isListed === false) {
            throw new BadRequestException('Stock is already delisted');
        }

        stock.isListed = false;
        await stock.save();

        await this.auditLogsService.create({
            actorId: currentAdminId,
            actorType: AuditActorType.Admin,
            action: AuditLogAction.StockDelisted,
            targetType: AuditTargetType.Stock,
            targetId: stock._id.toString(),
            description: 'Stock delisted by admin/analyst',
            changes: {
                isListed: {
                    before: true,
                    after: false,
                },
            },
            metadata: {
                ticker: stock.ticker,
                companyName: stock.companyName,
            },
        });

        return {
            message: 'Stock delisted successfully',
            stock: this.toStockResponse(stock),
        };
    }

    private toStockResponse(stock: StockDocument): StockResponse {
        return {
            id: stock._id.toString(),
            ticker: stock.ticker,
            companyName: stock.companyName,
            sector: stock.sector,
            currentPrice: stock.currentPrice,
            description: stock.description,
            isListed: stock.isListed,
            createdAt: stock.createdAt,
            updatedAt: stock.updatedAt,
        };
    }
}
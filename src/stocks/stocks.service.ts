import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateStockDto } from './dto/create-stock.dto';
import { ListStocksQueryDto } from './dto/list-stocks-query.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { PriceHistory, PriceHistoryDocument } from './schemas/price-history.schema';
import { Stock, StockDocument } from './schemas/stock.schema';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { AuditActorType, AuditLogAction, AuditTargetType } from 'src/audit-logs/types/audit-log-action.type';

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


        if (!dto.companyName && !dto.sector && dto.currentPrice === undefined && !dto.description) {
            throw new NotFoundException('No update data provided');
        }
        const stock = await this.stockModel.findById(id).exec();

        if (!stock) {
            throw new NotFoundException('Stock not found');
        }

        const oldPrice = stock.currentPrice;
        const isPriceChanged = typeof dto.currentPrice === 'number' && dto.currentPrice !== oldPrice;

        if (dto.companyName !== undefined) {
            stock.companyName = dto.companyName;
        }

        if (dto.sector !== undefined) {
            stock.sector = dto.sector;
        }

        if (dto.description !== undefined) {
            stock.description = dto.description;
        }

        if (dto.currentPrice !== undefined) {
            stock.currentPrice = dto.currentPrice;
        }

        await stock.save();

        if (isPriceChanged) {
            await this.priceHistoryModel.create({
                stockId: stock._id,
                price: stock.currentPrice,
                recordedAt: new Date(),
            });
        }

        const changes: Record<string, { before?: unknown; after?: unknown }> = {};

        if (dto.companyName !== undefined && dto.companyName !== stock.companyName) {
            changes.companyName = {
                before: stock.companyName,
                after: dto.companyName,
            };
        }

        if (dto.sector !== undefined && dto.sector !== stock.sector) {
            changes.sector = {
                before: stock.sector,
                after: dto.sector,
            };
        }

        if (dto.currentPrice !== undefined && dto.currentPrice !== stock.currentPrice) {
            changes.currentPrice = {
                before: stock.currentPrice,
                after: dto.currentPrice,
            };
        }

        if (dto.description !== undefined && dto.description !== stock.description) {
            changes.description = {
                before: stock.description,
                after: dto.description,
            };
        }
        if (Object.keys(changes).length > 0) {
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
        }

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
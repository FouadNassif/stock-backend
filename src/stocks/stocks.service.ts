import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateStockDto } from './dto/create-stock.dto';
import { ListStocksQueryDto } from './dto/list-stocks-query.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { PriceHistory, PriceHistoryDocument } from './schemas/price-history.schema';
import { Stock, StockDocument } from './schemas/stock.schema';

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
        this.validateObjectId(id);


        if (!dto.companyName && !dto.sector && dto.currentPrice === undefined && !dto.description) {
            throw new NotFoundException('No update data provided');
        }
        const stock = await this.stockModel.findById(id).exec();

        if (!stock) {
            throw new NotFoundException('Stock not found');
        }

        const oldPrice = stock.currentPrice;
        const isPriceChanged =
            typeof dto.currentPrice === 'number' && dto.currentPrice !== oldPrice;

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

        return {
            message: 'Stock updated successfully',
            stock: this.toStockResponse(stock),
        };
    }

    async delistStock(id: string): Promise<{
        message: string;
        stock: StockResponse;
    }> {
        this.validateObjectId(id);

        const stock = await this.stockModel.findById(id).exec();

        if (!stock) {
            throw new NotFoundException('Stock not found');
        }

        stock.isListed = false;
        await stock.save();

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

    private validateObjectId(id: string): void {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('Stock not found');
        }
    }
}
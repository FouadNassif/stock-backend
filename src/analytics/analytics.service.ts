import {
    BadGatewayException,
    Injectable,
    ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { lastValueFrom } from 'rxjs';

import { ActiveMembersQueryDto } from './dto/active-members-query.dto';
import { AnalyticsVolumeQueryDto } from './dto/analytics-volume-query.dto';
import { TopStocksQueryDto } from './dto/top-stocks-query.dto';

@Injectable()
export class AnalyticsService {
    private readonly analyticsServiceUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.analyticsServiceUrl = this.configService.getOrThrow<string>(
            'ANALYTICS_SERVICE_URL',
        );
    }

    async getTradingVolume(query: AnalyticsVolumeQueryDto): Promise<unknown> {
        return this.get('/internal/analytics/volume', {
            stock_id: query.stock_id,
            granularity: query.granularity,
            from: query.from,
            to: query.to,
        });
    }

    async getTopTradedStocks(query: TopStocksQueryDto): Promise<unknown> {
        return this.get('/internal/analytics/stocks/top', {
            page: query.page,
            limit: query.limit,
        });
    }

    async getAum(): Promise<unknown> {
        return this.get('/internal/analytics/aum');
    }

    async getActiveMembers(query: ActiveMembersQueryDto): Promise<unknown> {
        return this.get('/internal/analytics/members/active', {
            days: query.days,
            limit: query.limit,
        });
    }

    async getSectorAllocation(): Promise<unknown> {
        return this.get('/internal/analytics/sectors');
    }

    private async get(
        path: string,
        params?: Record<string, string | number>,
    ): Promise<unknown> {
        try {
            const response = await lastValueFrom(
                this.httpService.get(`${this.analyticsServiceUrl}${path}`, {
                    params,
                }),
            );

            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                if (!error.response) {
                    throw new ServiceUnavailableException(
                        'Analytics service is unavailable',
                    );
                }

                throw new BadGatewayException({
                    message: 'Analytics service request failed',
                    statusCode: error.response.status,
                    details: error.response.data,
                });
            }

            throw new ServiceUnavailableException(
                'Analytics service is unavailable',
            );
        }
    }
}
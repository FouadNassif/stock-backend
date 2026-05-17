from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Query

from app.models.analytics_models import (
    ActiveMemberItem,
    AdminAnalyticsSummaryResponse,
    AumResponse,
    PaginatedTopTradedStocksResponse,
    SectorAllocationResponse,
    TradingVolumePoint,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/internal/analytics", tags=["analytics"])


@router.get("/volume", response_model=list[TradingVolumePoint])
async def get_trading_volume(
    stock_id: str = Query(...),
    granularity: Literal["day", "month"] = Query("day"),
    date_from: datetime = Query(..., alias="from"),
    date_to: datetime = Query(..., alias="to"),
):
    service = AnalyticsService()

    return await service.get_trading_volume(
        stock_id=stock_id,
        granularity=granularity,
        date_from=date_from,
        date_to=date_to,
    )


@router.get("/stocks/top", response_model=PaginatedTopTradedStocksResponse)
async def get_top_traded_stocks(
    page: int = Query(1, ge=1),
    limit: int = Query(5, ge=1, le=100),
):
    service = AnalyticsService()

    return await service.get_top_traded_stocks(
        page=page,
        limit=limit,
    )


@router.get("/aum", response_model=AumResponse)
async def get_aum():
    service = AnalyticsService()

    return await service.get_aum()


@router.get("/members/active", response_model=list[ActiveMemberItem])
async def get_active_members(
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(10, ge=1, le=100),
):
    service = AnalyticsService()

    return await service.get_active_members(
        days=days,
        limit=limit,
    )


@router.get("/sectors", response_model=SectorAllocationResponse)
async def get_sector_allocation():
    service = AnalyticsService()

    return await service.get_sector_allocation()

@router.get("/admin/summary", response_model=AdminAnalyticsSummaryResponse)
async def get_admin_summary():
    service = AnalyticsService()

    return await service.get_admin_summary()
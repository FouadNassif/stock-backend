from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class TradingVolumePoint(BaseModel):
    date: str
    sharesTraded: float
    totalValue: float


class TopTradedStockItem(BaseModel):
    stockId: str
    ticker: str
    companyName: str
    tradeCount: int
    totalVolume: float


class PaginatedTopTradedStocksResponse(BaseModel):
    data: list[TopTradedStockItem]
    page: int
    limit: int
    total: int
    totalPages: int


class AumResponse(BaseModel):
    walletBalanceTotal: float
    openPositionsValue: float
    totalAum: float


class ActiveMemberItem(BaseModel):
    memberId: str
    fullName: str
    email: str
    tradeCount: int


class SectorAllocationItem(BaseModel):
    sector: str
    currentValue: float
    percentageOfAum: float


class SectorAllocationResponse(BaseModel):
    totalAum: float
    sectors: list[SectorAllocationItem]
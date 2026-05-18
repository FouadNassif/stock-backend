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
    
class MembersGrowthSummary(BaseModel):
    totalMembers: int
    currentMonthMembers: int
    previousMonthMembers: int
    monthOverMonthGrowthRate: float


class PendingWithdrawalsSummary(BaseModel):
    totalPendingWithdrawals: int
    totalPendingAmount: float


class AdminAnalyticsSummaryResponse(BaseModel):
    members: MembersGrowthSummary
    withdrawals: PendingWithdrawalsSummary
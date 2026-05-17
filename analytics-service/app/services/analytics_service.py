from datetime import datetime, timedelta, timezone
from math import ceil

from bson import ObjectId
from fastapi import HTTPException, status

from app.database import get_database
from app.models.analytics_models import (
    ActiveMemberItem,
    AdminAnalyticsSummaryResponse,
    AumResponse,
    MembersGrowthSummary,
    PaginatedTopTradedStocksResponse,
    PendingWithdrawalsSummary,
    SectorAllocationItem,
    SectorAllocationResponse,
    TopTradedStockItem,
    TradingVolumePoint,
)


def _to_object_id(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ObjectId",
        )

    return ObjectId(value)


class AnalyticsService:
    def __init__(self) -> None:
        self.database = get_database()

    async def get_trading_volume(
        self,
        stock_id: str,
        granularity: str,
        date_from: datetime,
        date_to: datetime,
    ) -> list[TradingVolumePoint]:
        stock_object_id = _to_object_id(stock_id)

        if granularity not in {"day", "month"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="granularity must be either day or month",
            )

        if date_from > date_to:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="from date must be before to date",
            )

        date_format = "%Y-%m-%d" if granularity == "day" else "%Y-%m"

        pipeline = [
            {
                "$match": {
                    "stockId": stock_object_id,
                    "status": "completed",
                    "type": {"$in": ["buy", "sell"]},
                    "createdAt": {
                        "$gte": date_from,
                        "$lte": date_to,
                    },
                }
            },
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format": date_format,
                            "date": "$createdAt",
                        }
                    },
                    "sharesTraded": {"$sum": "$quantity"},
                    "totalValue": {"$sum": "$totalAmount"},
                }
            },
            {"$sort": {"_id": 1}},
            {
                "$project": {
                    "_id": 0,
                    "date": "$_id",
                    "sharesTraded": 1,
                    "totalValue": 1,
                }
            },
        ]

        rows = await self.database.orders.aggregate(pipeline).to_list(length=None)

        return [
            TradingVolumePoint(
                date=row["date"],
                sharesTraded=float(row.get("sharesTraded", 0)),
                totalValue=float(row.get("totalValue", 0)),
            )
            for row in rows
        ]

    async def get_top_traded_stocks(
        self,
        page: int,
        limit: int,
    ) -> PaginatedTopTradedStocksResponse:
        skip = (page - 1) * limit

        base_pipeline = [
            {
                "$match": {
                    "status": "completed",
                    "type": {"$in": ["buy", "sell"]},
                }
            },
            {
                "$group": {
                    "_id": "$stockId",
                    "tradeCount": {"$sum": 1},
                    "totalVolume": {"$sum": "$quantity"},
                }
            },
        ]

        count_pipeline = [
            *base_pipeline,
            {"$count": "total"},
        ]

        count_result = await self.database.orders.aggregate(count_pipeline).to_list(
            length=1,
        )

        total = count_result[0]["total"] if count_result else 0

        data_pipeline = [
            *base_pipeline,
            {"$sort": {"tradeCount": -1, "totalVolume": -1}},
            {"$skip": skip},
            {"$limit": limit},
            {
                "$lookup": {
                    "from": "stocks",
                    "localField": "_id",
                    "foreignField": "_id",
                    "as": "stock",
                }
            },
            {"$unwind": "$stock"},
            {
                "$project": {
                    "_id": 0,
                    "stockId": {"$toString": "$_id"},
                    "ticker": "$stock.ticker",
                    "companyName": "$stock.companyName",
                    "tradeCount": 1,
                    "totalVolume": 1,
                }
            },
        ]

        rows = await self.database.orders.aggregate(data_pipeline).to_list(
            length=None,
        )

        return PaginatedTopTradedStocksResponse(
            data=[
                TopTradedStockItem(
                    stockId=row["stockId"],
                    ticker=row["ticker"],
                    companyName=row["companyName"],
                    tradeCount=int(row.get("tradeCount", 0)),
                    totalVolume=float(row.get("totalVolume", 0)),
                )
                for row in rows
            ],
            page=page,
            limit=limit,
            total=total,
            totalPages=ceil(total / limit) if total > 0 else 0,
        )

    async def get_aum(self) -> AumResponse:
        wallet_pipeline = [
            {
                "$group": {
                    "_id": None,
                    "walletBalanceTotal": {"$sum": "$walletBalance"},
                }
            }
        ]

        wallet_result = await self.database.members.aggregate(wallet_pipeline).to_list(
            length=1,
        )

        wallet_total = (
            float(wallet_result[0].get("walletBalanceTotal", 0))
            if wallet_result
            else 0
        )

        positions_pipeline = [
            {"$match": {"status": "open"}},
            {
                "$lookup": {
                    "from": "stocks",
                    "localField": "stockId",
                    "foreignField": "_id",
                    "as": "stock",
                }
            },
            {"$unwind": "$stock"},
            {
                "$group": {
                    "_id": None,
                    "openPositionsValue": {
                        "$sum": {
                            "$multiply": [
                                "$sharesHeld",
                                "$stock.currentPrice",
                            ]
                        }
                    },
                }
            },
        ]

        positions_result = await self.database.positions.aggregate(
            positions_pipeline,
        ).to_list(length=1)

        open_positions_value = (
            float(positions_result[0].get("openPositionsValue", 0))
            if positions_result
            else 0
        )

        return AumResponse(
            walletBalanceTotal=wallet_total,
            openPositionsValue=open_positions_value,
            totalAum=wallet_total + open_positions_value,
        )

    async def get_active_members(
        self,
        days: int,
        limit: int,
    ) -> list[ActiveMemberItem]:
        from_date = datetime.now(timezone.utc) - timedelta(days=days)

        pipeline = [
            {
                "$match": {
                    "status": "completed",
                    "type": {"$in": ["buy", "sell"]},
                    "createdAt": {"$gte": from_date},
                }
            },
            {
                "$group": {
                    "_id": "$memberId",
                    "tradeCount": {"$sum": 1},
                }
            },
            {"$sort": {"tradeCount": -1}},
            {"$limit": limit},
            {
                "$lookup": {
                    "from": "members",
                    "localField": "_id",
                    "foreignField": "_id",
                    "as": "member",
                }
            },
            {"$unwind": "$member"},
            {
                "$project": {
                    "_id": 0,
                    "memberId": {"$toString": "$_id"},
                    "fullName": "$member.fullName",
                    "email": "$member.email",
                    "tradeCount": 1,
                }
            },
        ]

        rows = await self.database.orders.aggregate(pipeline).to_list(length=None)

        return [
            ActiveMemberItem(
                memberId=row["memberId"],
                fullName=row["fullName"],
                email=row["email"],
                tradeCount=int(row.get("tradeCount", 0)),
            )
            for row in rows
        ]

    async def get_sector_allocation(self) -> SectorAllocationResponse:
        aum = await self.get_aum()

        pipeline = [
            {"$match": {"status": "open"}},
            {
                "$lookup": {
                    "from": "stocks",
                    "localField": "stockId",
                    "foreignField": "_id",
                    "as": "stock",
                }
            },
            {"$unwind": "$stock"},
            {
                "$group": {
                    "_id": "$stock.sector",
                    "currentValue": {
                        "$sum": {
                            "$multiply": [
                                "$sharesHeld",
                                "$stock.currentPrice",
                            ]
                        }
                    },
                }
            },
            {"$sort": {"currentValue": -1}},
            {
                "$project": {
                    "_id": 0,
                    "sector": "$_id",
                    "currentValue": 1,
                }
            },
        ]

        rows = await self.database.positions.aggregate(pipeline).to_list(length=None)

        total_aum = aum.totalAum

        sectors = []
        for row in rows:
            current_value = float(row.get("currentValue", 0))
            percentage = (current_value / total_aum * 100) if total_aum > 0 else 0

            sectors.append(
                SectorAllocationItem(
                    sector=row["sector"],
                    currentValue=current_value,
                    percentageOfAum=round(percentage, 2),
                )
            )

        return SectorAllocationResponse(
            totalAum=total_aum,
            sectors=sectors,
        )
        
    async def get_admin_summary(self) -> AdminAnalyticsSummaryResponse:
        now = datetime.now(timezone.utc)

        current_month_start = datetime(
            year=now.year,
            month=now.month,
            day=1,
            tzinfo=timezone.utc,
        )

        if now.month == 1:
            previous_month_start = datetime(
                year=now.year - 1,
                month=12,
                day=1,
                tzinfo=timezone.utc,
            )
        else:
            previous_month_start = datetime(
                year=now.year,
                month=now.month - 1,
                day=1,
                tzinfo=timezone.utc,
            )

        total_members = await self.database.members.count_documents({})

        current_month_members = await self.database.members.count_documents(
            {
                "createdAt": {
                    "$gte": current_month_start,
                    "$lte": now,
                }
            }
        )

        previous_month_members = await self.database.members.count_documents(
            {
                "createdAt": {
                    "$gte": previous_month_start,
                    "$lt": current_month_start,
                }
            }
        )

        if previous_month_members == 0:
            month_over_month_growth_rate = (
                100.0 if current_month_members > 0 else 0.0
            )
        else:
            month_over_month_growth_rate = (
                (current_month_members - previous_month_members)
                / previous_month_members
            ) * 100

        pending_withdrawals_pipeline = [
            {
                "$match": {
                    "type": "withdrawal",
                    "status": "pending",
                }
            },
            {
                "$group": {
                    "_id": None,
                    "totalPendingWithdrawals": {"$sum": 1},
                    "totalPendingAmount": {"$sum": "$amount"},
                }
            },
        ]

        pending_result = await self.database.transactions.aggregate(
            pending_withdrawals_pipeline,
        ).to_list(length=1)

        pending_summary = pending_result[0] if pending_result else {}

        return AdminAnalyticsSummaryResponse(
            members=MembersGrowthSummary(
                totalMembers=total_members,
                currentMonthMembers=current_month_members,
                previousMonthMembers=previous_month_members,
                monthOverMonthGrowthRate=round(month_over_month_growth_rate, 2),
            ),
            withdrawals=PendingWithdrawalsSummary(
                totalPendingWithdrawals=int(
                    pending_summary.get("totalPendingWithdrawals", 0),
                ),
                totalPendingAmount=float(
                    pending_summary.get("totalPendingAmount", 0),
                ),
            ),
        )
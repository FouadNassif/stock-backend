from fastapi import APIRouter

from app.config import settings
from app.database import get_database

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health_check():
    database = get_database()

    await database.command("ping")

    return {
        "status": "ok",
        "service": settings.service_name,
        "database": settings.mongo_database,
    }
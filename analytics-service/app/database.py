from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings

mongo_client: AsyncIOMotorClient | None = None


async def connect_to_mongo() -> None:
    global mongo_client

    mongo_client = AsyncIOMotorClient(settings.mongo_uri)

    await mongo_client.admin.command("ping")


async def close_mongo_connection() -> None:
    global mongo_client

    if mongo_client is not None:
        mongo_client.close()
        mongo_client = None


def get_database():
    if mongo_client is None:
        raise RuntimeError("MongoDB client is not initialized")

    return mongo_client[settings.mongo_database]
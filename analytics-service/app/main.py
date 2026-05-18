from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database import close_mongo_connection, connect_to_mongo
from app.routes.health import router as health_router
from app.routes.analytics import router as analytics_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title="Stock Market Analytics Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(health_router)
app.include_router(analytics_router)

@app.get("/")
async def root():
    return {
        "message": "Stock Market Analytics Service is running",
    }
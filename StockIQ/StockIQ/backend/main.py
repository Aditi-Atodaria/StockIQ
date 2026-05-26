"""
Main FastAPI application entry point.
Stock Market Intelligence Platform — Backend API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import init_db
from routers import stock, market, search


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and startup tasks."""
    init_db()
    yield


app = FastAPI(
    title="Stock Market Intelligence API",
    description="Production-ready stock analysis, regime detection & strategy recommendation engine",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stock.router, prefix="/api/stock", tags=["Stock Data"])
app.include_router(market.router, prefix="/api/market", tags=["Market Overview"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])


@app.get("/")
async def root():
    return {"status": "ok", "service": "Stock Market Intelligence API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}

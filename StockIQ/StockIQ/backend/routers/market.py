"""
Market Overview Router — market-wide endpoints.
  GET /api/market/movers    → Top gainers & losers
  GET /api/market/popular   → Popular stocks list
"""

from fastapi import APIRouter, HTTPException
from services.data_service import get_market_movers, POPULAR_STOCKS

router = APIRouter()


@router.get("/movers")
async def market_movers():
    """Get top gainers and losers from Nifty 50."""
    try:
        movers = get_market_movers()
        return movers
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/popular")
async def popular_stocks():
    """Return the popular stocks registry for the dashboard watchlist."""
    return {"stocks": POPULAR_STOCKS}

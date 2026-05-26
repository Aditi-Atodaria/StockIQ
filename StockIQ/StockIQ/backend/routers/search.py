"""
Search Router  
  GET /api/search?q=query   → Search stocks by name or symbol
"""

from fastapi import APIRouter, Query
from services.data_service import POPULAR_STOCKS

router = APIRouter()


@router.get("")
async def search_stocks(q: str = Query(..., min_length=1)):
    """Search for stocks by symbol or company name."""
    q_lower = q.lower()
    results = [
        s for s in POPULAR_STOCKS
        if q_lower in s["symbol"].lower() or q_lower in s["name"].lower()
    ]
    return {"query": q, "results": results[:10]}

"""
Stock API Router — all per-stock endpoints.

Endpoints:
  GET /api/stock/{symbol}/ohlcv          → OHLCV time-series data
  GET /api/stock/{symbol}/indicators     → All technical indicators
  GET /api/stock/{symbol}/regime         → Market regime detection
  GET /api/stock/{symbol}/strategy       → Strategy recommendation
  GET /api/stock/{symbol}/news           → News + sentiment
  GET /api/stock/{symbol}/full           → All of the above in one call
  GET /api/stock/{symbol}/info           → Stock metadata
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from services.data_service import fetch_ohlcv, fetch_stock_info, normalize_symbol
from services.indicators import compute_all_indicators
from services.regime_detector import detect_regime
from services.strategy_engine import get_strategy_recommendation
from services.news_service import get_news_with_sentiment

router = APIRouter()


def _get_indicators_data(symbol: str, period: str = "6mo"):
    """Shared helper: fetch data + compute all indicators."""
    try:
        df = fetch_ohlcv(symbol, period=period)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Data fetch error: {str(e)}")
    
    if len(df) < 30:
        raise HTTPException(status_code=422, detail="Insufficient data for analysis (need 30+ bars)")
    
    indicators = compute_all_indicators(df)
    return df, indicators


@router.get("/{symbol}/ohlcv")
async def get_ohlcv(
    symbol: str,
    period: str = Query("6mo", description="1mo, 3mo, 6mo, 1y, 2y, 5y"),
    interval: str = Query("1d", description="1d, 1wk, 1mo"),
):
    """Get OHLCV candlestick data for charting."""
    symbol = normalize_symbol(symbol)
    try:
        df = fetch_ohlcv(symbol, period=period, interval=interval)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    
    n = len(df)
    timestamps = [str(t)[:19] for t in df.index.tolist()]
    
    return {
        "symbol": symbol,
        "period": period,
        "interval": interval,
        "count": n,
        "timestamps": timestamps,
        "open": df["open"].round(2).tolist(),
        "high": df["high"].round(2).tolist(),
        "low": df["low"].round(2).tolist(),
        "close": df["close"].round(2).tolist(),
        "volume": df["volume"].tolist(),
    }


@router.get("/{symbol}/indicators")
async def get_indicators(
    symbol: str,
    period: str = Query("6mo"),
):
    """Get all technical indicators for a stock."""
    symbol = normalize_symbol(symbol)
    df, indicators = _get_indicators_data(symbol, period)
    
    # Remove internal _raw key before returning
    result = {k: v for k, v in indicators.items() if k != "_raw"}
    result["symbol"] = symbol
    return result


@router.get("/{symbol}/regime")
async def get_regime(
    symbol: str,
    period: str = Query("6mo"),
):
    """Detect and return the current market regime."""
    symbol = normalize_symbol(symbol)
    df, indicators = _get_indicators_data(symbol, period)
    regime_result = detect_regime(df, indicators)
    regime_result["symbol"] = symbol
    return regime_result


@router.get("/{symbol}/strategy")
async def get_strategy(
    symbol: str,
    period: str = Query("6mo"),
):
    """Get strategy recommendation based on detected regime."""
    symbol = normalize_symbol(symbol)
    df, indicators = _get_indicators_data(symbol, period)
    regime_result = detect_regime(df, indicators)
    
    strategy = get_strategy_recommendation(
        regime=regime_result["regime"],
        indicators=regime_result["indicators"],
        regime_confidence=regime_result["confidence"],
    )
    strategy["symbol"] = symbol
    strategy["regime_details"] = {
        "regime": regime_result["regime"],
        "label": regime_result["label"],
        "color": regime_result["color"],
        "signals": regime_result["signals"],
    }
    return strategy


@router.get("/{symbol}/news")
async def get_news(symbol: str):
    """Fetch latest news with sentiment analysis."""
    symbol = normalize_symbol(symbol)
    try:
        info = fetch_stock_info(symbol)
        company_name = info.get("name", symbol)
    except Exception:
        company_name = symbol
    
    news_data = get_news_with_sentiment(symbol, company_name)
    news_data["symbol"] = symbol
    return news_data


@router.get("/{symbol}/info")
async def get_info(symbol: str):
    """Get stock metadata and fundamental data."""
    symbol = normalize_symbol(symbol)
    info = fetch_stock_info(symbol)
    return info


@router.get("/{symbol}/full")
async def get_full_analysis(
    symbol: str,
    period: str = Query("6mo"),
):
    """
    All-in-one endpoint: OHLCV + Indicators + Regime + Strategy + News.
    Use this to load a full stock analysis page in a single request.
    """
    symbol = normalize_symbol(symbol)
    
    # Fetch data once, use for everything
    df, indicators = _get_indicators_data(symbol, period)
    regime_result = detect_regime(df, indicators)
    strategy = get_strategy_recommendation(
        regime=regime_result["regime"],
        indicators=regime_result["indicators"],
        regime_confidence=regime_result["confidence"],
    )
    
    # Get news async-ish
    try:
        info = fetch_stock_info(symbol)
        company_name = info.get("name", symbol)
    except Exception:
        info = {"symbol": symbol}
        company_name = symbol
    
    news_data = get_news_with_sentiment(symbol, company_name)
    
    # Strip _raw from indicators before sending
    indicators_clean = {k: v for k, v in indicators.items() if k != "_raw"}

    return {
        "symbol": symbol,
        "info": info,
        "ohlcv": {
            "timestamps": indicators_clean["timestamps"],
            "open": indicators_clean["ohlcv"]["open"],
            "high": indicators_clean["ohlcv"]["high"],
            "low": indicators_clean["ohlcv"]["low"],
            "close": indicators_clean["ohlcv"]["close"],
            "volume": indicators_clean["ohlcv"]["volume"],
        },
        "indicators": {
            "latest": indicators_clean["latest"],
            "series": indicators_clean["series"],
        },
        "regime": regime_result,
        "strategy": strategy,
        "news": news_data,
    }

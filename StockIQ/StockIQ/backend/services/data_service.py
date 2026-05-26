"""
Stock Data Service — fetches OHLCV data from Yahoo Finance.
Indian stocks use the `.NS` (NSE) or `.BO` (BSE) suffix.
"""

import yfinance as yf
import pandas as pd
from typing import Optional
from datetime import datetime, timedelta


EXCHANGE_SUFFIXES = {
    "NSE": ".NS",
    "BSE": ".BO",
    "US": "",
}

# Popular Indian stocks registry
POPULAR_STOCKS = [
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "exchange": "NSE", "sector": "Energy"},
    {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "exchange": "NSE", "sector": "IT"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "exchange": "NSE", "sector": "Banking"},
    {"symbol": "INFY.NS", "name": "Infosys", "exchange": "NSE", "sector": "IT"},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "exchange": "NSE", "sector": "Banking"},
    {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever", "exchange": "NSE", "sector": "FMCG"},
    {"symbol": "SBIN.NS", "name": "State Bank of India", "exchange": "NSE", "sector": "Banking"},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel", "exchange": "NSE", "sector": "Telecom"},
    {"symbol": "ITC.NS", "name": "ITC Ltd", "exchange": "NSE", "sector": "FMCG"},
    {"symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank", "exchange": "NSE", "sector": "Banking"},
    {"symbol": "WIPRO.NS", "name": "Wipro", "exchange": "NSE", "sector": "IT"},
    {"symbol": "AXISBANK.NS", "name": "Axis Bank", "exchange": "NSE", "sector": "Banking"},
    {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance", "exchange": "NSE", "sector": "Finance"},
    {"symbol": "MARUTI.NS", "name": "Maruti Suzuki", "exchange": "NSE", "sector": "Automobile"},
    {"symbol": "TATAMOTORS.NS", "name": "Tata Motors", "exchange": "NSE", "sector": "Automobile"},
    {"symbol": "SUNPHARMA.NS", "name": "Sun Pharmaceutical", "exchange": "NSE", "sector": "Pharma"},
    {"symbol": "ULTRACEMCO.NS", "name": "UltraTech Cement", "exchange": "NSE", "sector": "Materials"},
    {"symbol": "NESTLEIND.NS", "name": "Nestle India", "exchange": "NSE", "sector": "FMCG"},
    {"symbol": "TITAN.NS", "name": "Titan Company", "exchange": "NSE", "sector": "Consumer"},
    {"symbol": "HCLTECH.NS", "name": "HCL Technologies", "exchange": "NSE", "sector": "IT"},
    # US stocks for global coverage
    {"symbol": "AAPL", "name": "Apple Inc.", "exchange": "US", "sector": "Technology"},
    {"symbol": "MSFT", "name": "Microsoft Corp.", "exchange": "US", "sector": "Technology"},
    {"symbol": "GOOGL", "name": "Alphabet Inc.", "exchange": "US", "sector": "Technology"},
    {"symbol": "AMZN", "name": "Amazon.com", "exchange": "US", "sector": "E-Commerce"},
    {"symbol": "TSLA", "name": "Tesla Inc.", "exchange": "US", "sector": "Automobile"},
]


def normalize_symbol(symbol: str) -> str:
    """Auto-append .NS for NSE Indian stocks if no suffix detected."""
    symbol = symbol.upper().strip()
    if "." not in symbol and not symbol.endswith(".NS") and not symbol.endswith(".BO"):
        # Check if it matches a known Indian stock base symbol
        indian_bases = {s["symbol"].replace(".NS", "") for s in POPULAR_STOCKS if s["exchange"] == "NSE"}
        if symbol in indian_bases:
            return symbol + ".NS"
    return symbol


def fetch_ohlcv(symbol: str, period: str = "6mo", interval: str = "1d") -> pd.DataFrame:
    """
    Fetch OHLCV data from Yahoo Finance.
    
    Args:
        symbol: Ticker symbol (e.g., RELIANCE.NS, AAPL)
        period: Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y)
        interval: Bar interval (1m, 5m, 15m, 1h, 1d, 1wk, 1mo)
    
    Returns:
        DataFrame with columns: Open, High, Low, Close, Volume
    """
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period, interval=interval, auto_adjust=True)
    
    if df.empty:
        raise ValueError(f"No data found for symbol: {symbol}")
    
    df.index = pd.to_datetime(df.index)
    df = df[["Open", "High", "Low", "Close", "Volume"]].copy()
    df.columns = ["open", "high", "low", "close", "volume"]
    df = df.dropna()
    
    return df


def fetch_stock_info(symbol: str) -> dict:
    """Fetch stock metadata from Yahoo Finance."""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        return {
            "symbol": symbol,
            "name": info.get("longName") or info.get("shortName", symbol),
            "exchange": info.get("exchange", ""),
            "sector": info.get("sector", "Unknown"),
            "industry": info.get("industry", "Unknown"),
            "market_cap": info.get("marketCap"),
            "currency": info.get("currency", "INR"),
            "country": info.get("country", "India"),
            "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
            "previous_close": info.get("previousClose"),
            "day_high": info.get("dayHigh"),
            "day_low": info.get("dayLow"),
            "52w_high": info.get("fiftyTwoWeekHigh"),
            "52w_low": info.get("fiftyTwoWeekLow"),
            "pe_ratio": info.get("trailingPE"),
            "eps": info.get("trailingEps"),
            "dividend_yield": info.get("dividendYield"),
            "beta": info.get("beta"),
            "avg_volume": info.get("averageVolume"),
        }
    except Exception as e:
        return {"symbol": symbol, "name": symbol, "error": str(e)}


def get_market_movers() -> dict:
    """Get top gainers and losers from Nifty 50 constituents."""
    nifty50 = [
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
        "HINDUNILVR.NS", "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "KOTAKBANK.NS",
        "WIPRO.NS", "AXISBANK.NS", "BAJFINANCE.NS", "MARUTI.NS", "TATAMOTORS.NS",
    ]

    movers = []
    for sym in nifty50:
        try:
            ticker = yf.Ticker(sym)
            info = ticker.fast_info
            price = getattr(info, "last_price", None)
            prev = getattr(info, "previous_close", None)
            if price and prev and prev > 0:
                change_pct = ((price - prev) / prev) * 100
                movers.append({
                    "symbol": sym,
                    "name": sym.replace(".NS", ""),
                    "price": round(price, 2),
                    "change_pct": round(change_pct, 2),
                    "change_abs": round(price - prev, 2),
                })
        except Exception:
            continue

    movers.sort(key=lambda x: x["change_pct"], reverse=True)
    return {
        "gainers": movers[:5],
        "losers": movers[-5:][::-1],
    }

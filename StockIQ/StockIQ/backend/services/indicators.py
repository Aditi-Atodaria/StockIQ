"""
Technical Indicators Service.
Computes RSI, MACD, EMA, Bollinger Bands, ADX, ATR using pandas-ta.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any


def compute_rsi(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """Relative Strength Index."""
    delta = df["close"].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
    avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()
    rs = avg_gain / avg_loss.replace(0, float("inf"))
    return 100 - (100 / (1 + rs))


def compute_macd(df: pd.DataFrame, fast: int = 12, slow: int = 26, signal: int = 9):
    """MACD Line, Signal Line, and Histogram."""
    ema_fast = df["close"].ewm(span=fast, adjust=False).mean()
    ema_slow = df["close"].ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram


def compute_ema(df: pd.DataFrame, period: int) -> pd.Series:
    """Exponential Moving Average."""
    return df["close"].ewm(span=period, adjust=False).mean()


def compute_sma(df: pd.DataFrame, period: int) -> pd.Series:
    """Simple Moving Average."""
    return df["close"].rolling(window=period).mean()


def compute_bollinger_bands(df: pd.DataFrame, period: int = 20, std_dev: float = 2.0):
    """Upper, Middle (SMA), Lower Bollinger Bands."""
    sma = df["close"].rolling(window=period).mean()
    std = df["close"].rolling(window=period).std()
    upper = sma + (std_dev * std)
    lower = sma - (std_dev * std)
    width = (upper - lower) / sma
    return upper, sma, lower, width


def compute_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """Average True Range — volatility measure."""
    high_low = df["high"] - df["low"]
    high_close = abs(df["high"] - df["close"].shift())
    low_close = abs(df["low"] - df["close"].shift())
    tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    return tr.rolling(window=period).mean()


def compute_adx(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """
    Average Directional Index — trend strength (0-100).
    ADX > 25 = strong trend, < 20 = weak / no trend.
    """
    high = df["high"]
    low = df["low"]
    close = df["close"]

    plus_dm = high.diff()
    minus_dm = low.diff().abs()

    plus_dm[plus_dm < 0] = 0
    minus_dm[minus_dm < 0] = 0

    # True Range
    tr1 = high - low
    tr2 = abs(high - close.shift())
    tr3 = abs(low - close.shift())
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)

    atr = tr.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    plus_di = 100 * (plus_dm.ewm(alpha=1 / period, adjust=False).mean() / atr)
    minus_di = 100 * (minus_dm.ewm(alpha=1 / period, adjust=False).mean() / atr)

    dx = 100 * abs(plus_di - minus_di) / (plus_di + minus_di).replace(0, float("inf"))
    adx = dx.ewm(alpha=1 / period, adjust=False).mean()
    return adx, plus_di, minus_di


def compute_volume_sma(df: pd.DataFrame, period: int = 20) -> pd.Series:
    return df["volume"].rolling(window=period).mean()


def compute_all_indicators(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Compute all technical indicators and return as a structured dict
    ready for API response and regime detection.
    """
    rsi = compute_rsi(df)
    macd_line, signal_line, histogram = compute_macd(df)
    ema_20 = compute_ema(df, 20)
    ema_50 = compute_ema(df, 50)
    ema_200 = compute_ema(df, 200)
    sma_20 = compute_sma(df, 20)
    bb_upper, bb_mid, bb_lower, bb_width = compute_bollinger_bands(df)
    atr = compute_atr(df)
    adx, plus_di, minus_di = compute_adx(df)
    vol_sma = compute_volume_sma(df)

    def safe_last(series, n=1):
        vals = series.dropna()
        if len(vals) < n:
            return None
        arr = vals.tail(n).tolist()
        return arr if n > 1 else arr[0]

    def round2(v):
        return round(v, 4) if v is not None else None

    # Build time-series arrays (last 200 bars)
    n = min(200, len(df))
    timestamps = [str(t)[:19] for t in df.index[-n:].tolist()]
    
    return {
        "timestamps": timestamps,
        "ohlcv": {
            "open": df["open"].tail(n).round(2).tolist(),
            "high": df["high"].tail(n).round(2).tolist(),
            "low": df["low"].tail(n).round(2).tolist(),
            "close": df["close"].tail(n).round(2).tolist(),
            "volume": df["volume"].tail(n).tolist(),
        },
        "latest": {
            "rsi": round2(safe_last(rsi)),
            "macd": round2(safe_last(macd_line)),
            "macd_signal": round2(safe_last(signal_line)),
            "macd_hist": round2(safe_last(histogram)),
            "ema_20": round2(safe_last(ema_20)),
            "ema_50": round2(safe_last(ema_50)),
            "ema_200": round2(safe_last(ema_200)),
            "sma_20": round2(safe_last(sma_20)),
            "bb_upper": round2(safe_last(bb_upper)),
            "bb_mid": round2(safe_last(bb_mid)),
            "bb_lower": round2(safe_last(bb_lower)),
            "bb_width": round2(safe_last(bb_width)),
            "atr": round2(safe_last(atr)),
            "adx": round2(safe_last(adx)),
            "plus_di": round2(safe_last(plus_di)),
            "minus_di": round2(safe_last(minus_di)),
            "volume_sma": round2(safe_last(vol_sma)),
        },
        "series": {
            "rsi": rsi.tail(n).round(4).tolist(),
            "macd": macd_line.tail(n).round(4).tolist(),
            "macd_signal": signal_line.tail(n).round(4).tolist(),
            "macd_hist": histogram.tail(n).round(4).tolist(),
            "ema_20": ema_20.tail(n).round(2).tolist(),
            "ema_50": ema_50.tail(n).round(2).tolist(),
            "ema_200": ema_200.tail(n).round(2).tolist(),
            "bb_upper": bb_upper.tail(n).round(2).tolist(),
            "bb_mid": bb_mid.tail(n).round(2).tolist(),
            "bb_lower": bb_lower.tail(n).round(2).tolist(),
            "adx": adx.tail(n).round(2).tolist(),
            "atr": atr.tail(n).round(2).tolist(),
            "volume_sma": vol_sma.tail(n).round(0).tolist(),
        },
        "_raw": {
            "rsi": rsi, "adx": adx, "atr": atr,
            "ema_50": ema_50, "ema_200": ema_200,
            "bb_width": bb_width, "macd": macd_line,
            "macd_signal": signal_line, "plus_di": plus_di,
            "minus_di": minus_di, "vol_sma": vol_sma,
        }
    }

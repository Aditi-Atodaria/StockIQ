"""
Regime Detection Engine.

Classifies stocks into market regimes:
- TRENDING_UP    : Strong uptrend (ADX > 25, EMA50 > EMA200)
- TRENDING_DOWN  : Strong downtrend (ADX > 25, EMA50 < EMA200)
- RANGE_BOUND    : Sideways market (ADX < 20, low BB width)
- VOLATILE       : High ATR, erratic price action
- BREAKOUT       : Price bursting out of consolidation with volume
- MEAN_REVERTING : Oscillating around mean (RSI extremes, low ADX)

Each regime includes:
- Confidence score: 0-100
- Key indicator values that drove the classification
- Human-readable explanation
"""

import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any


REGIMES = {
    "TRENDING_UP": {
        "label": "Trending Up 📈",
        "color": "#00d084",
        "description": "Stock is in a strong uptrend with increasing momentum.",
    },
    "TRENDING_DOWN": {
        "label": "Trending Down 📉",
        "color": "#ff4444",
        "description": "Stock is in a confirmed downtrend. Bears are in control.",
    },
    "RANGE_BOUND": {
        "label": "Range Bound ↔️",
        "color": "#f0b429",
        "description": "Price is consolidating in a tight range without clear direction.",
    },
    "VOLATILE": {
        "label": "Volatile ⚡",
        "color": "#c084fc",
        "description": "High volatility with unpredictable price swings.",
    },
    "BREAKOUT": {
        "label": "Breakout 🚀",
        "color": "#38bdf8",
        "description": "Price is breaking out of consolidation with volume confirmation.",
    },
    "MEAN_REVERTING": {
        "label": "Mean Reverting 🔄",
        "color": "#fb923c",
        "description": "Price oscillates around mean. Extremes tend to reverse.",
    },
}


def _safe_val(series: pd.Series) -> float:
    """Get last valid value from a pandas Series."""
    vals = series.dropna()
    return float(vals.iloc[-1]) if len(vals) > 0 else 0.0


def detect_regime(df: pd.DataFrame, indicators: dict) -> Dict[str, Any]:
    """
    Classify the market regime for a given stock.

    Args:
        df: OHLCV DataFrame
        indicators: Output from indicators.compute_all_indicators (with _raw key)

    Returns:
        dict with regime, confidence (0-100), signals, and explanation
    """
    raw = indicators["_raw"]

    adx = _safe_val(raw["adx"])
    atr = _safe_val(raw["atr"])
    rsi = _safe_val(raw["rsi"])
    ema_50 = _safe_val(raw["ema_50"])
    ema_200 = _safe_val(raw["ema_200"])
    bb_width = _safe_val(raw["bb_width"])
    macd = _safe_val(raw["macd"])
    macd_signal = _safe_val(raw["macd_signal"])
    plus_di = _safe_val(raw["plus_di"])
    minus_di = _safe_val(raw["minus_di"])

    current_price = df["close"].iloc[-1]
    vol_sma = _safe_val(raw["vol_sma"])
    current_volume = df["volume"].iloc[-1]
    volume_surge = (current_volume > vol_sma * 1.5) if vol_sma > 0 else False

    # --- ATR as % of price (normalized volatility) ---
    atr_pct = (atr / current_price * 100) if current_price > 0 else 0

    # --- Historical ATR percentile ---
    atr_series = raw["atr"].dropna()
    atr_percentile = (
        float(np.percentile(atr_series, 75))
        if len(atr_series) > 20
        else atr * 1.2
    )

    # --- BB width percentile ---
    bb_series = raw["bb_width"].dropna()
    bb_percentile_75 = (
        float(np.percentile(bb_series, 75))
        if len(bb_series) > 20
        else bb_width * 1.2
    )
    bb_percentile_25 = (
        float(np.percentile(bb_series, 25))
        if len(bb_series) > 20
        else bb_width * 0.8
    )

    signals = []
    scores = {}

    # ── TRENDING UP ──────────────────────────────────────────────
    trending_up_score = 0
    if adx > 25:
        trending_up_score += 35
        signals.append(f"ADX={adx:.1f} (strong trend)")
    elif adx > 20:
        trending_up_score += 15

    if ema_50 > ema_200 and ema_200 > 0:
        trending_up_score += 30
        signals.append("EMA50 > EMA200 (Golden Cross)")

    if plus_di > minus_di:
        trending_up_score += 20
        signals.append(f"+DI={plus_di:.1f} > -DI={minus_di:.1f}")

    if macd > macd_signal:
        trending_up_score += 15
        signals.append("MACD bullish crossover")

    scores["TRENDING_UP"] = min(trending_up_score, 100)

    # ── TRENDING DOWN ─────────────────────────────────────────────
    trending_down_score = 0
    if adx > 25:
        trending_down_score += 35
    elif adx > 20:
        trending_down_score += 15

    if ema_50 < ema_200 and ema_200 > 0:
        trending_down_score += 30
        signals.append("EMA50 < EMA200 (Death Cross)")

    if minus_di > plus_di:
        trending_down_score += 20

    if macd < macd_signal:
        trending_down_score += 15

    scores["TRENDING_DOWN"] = min(trending_down_score, 100)

    # ── RANGE BOUND ───────────────────────────────────────────────
    range_score = 0
    if adx < 20:
        range_score += 40
        signals.append(f"ADX={adx:.1f} (weak trend)")
    if bb_width < bb_percentile_25:
        range_score += 35
        signals.append("Bollinger Bands squeezed")
    if 40 < rsi < 60:
        range_score += 25
        signals.append(f"RSI={rsi:.1f} (neutral zone)")

    scores["RANGE_BOUND"] = min(range_score, 100)

    # ── VOLATILE ──────────────────────────────────────────────────
    volatile_score = 0
    if atr > atr_percentile:
        volatile_score += 50
        signals.append(f"ATR={atr:.2f} (above 75th percentile)")
    if atr_pct > 3.0:
        volatile_score += 30
        signals.append(f"ATR%={atr_pct:.1f}% of price")
    if rsi > 70 or rsi < 30:
        volatile_score += 20
        signals.append(f"RSI={rsi:.1f} (extreme zone)")

    scores["VOLATILE"] = min(volatile_score, 100)

    # ── BREAKOUT ──────────────────────────────────────────────────
    breakout_score = 0
    if volume_surge:
        breakout_score += 35
        signals.append(f"Volume surge ({current_volume/vol_sma:.1f}x avg)")
    if bb_width > bb_percentile_75:
        breakout_score += 35
        signals.append("BB width expanding (breakout)")
    if adx > 20 and adx <= 30:
        breakout_score += 20
        signals.append("ADX rising (new trend forming)")
    if abs(macd - macd_signal) > abs(macd_signal) * 0.1:
        breakout_score += 10

    scores["BREAKOUT"] = min(breakout_score, 100)

    # ── MEAN REVERTING ────────────────────────────────────────────
    mean_rev_score = 0
    if adx < 20:
        mean_rev_score += 30
    if rsi > 65 or rsi < 35:
        mean_rev_score += 40
        signals.append(f"RSI={rsi:.1f} (mean reversion zone)")
    if bb_width < bb_percentile_75:
        mean_rev_score += 30

    scores["MEAN_REVERTING"] = min(mean_rev_score, 100)

    # ── SELECT WINNER ─────────────────────────────────────────────
    # Resolve ties: trending beats range, breakout beats volatile
    regime = max(scores, key=scores.get)
    confidence = scores[regime]

    # Normalize confidence: scale to be meaningful (min 40, max 97)
    confidence = max(40, min(97, confidence))

    return {
        "regime": regime,
        "label": REGIMES[regime]["label"],
        "color": REGIMES[regime]["color"],
        "description": REGIMES[regime]["description"],
        "confidence": round(confidence, 1),
        "scores": {k: round(v, 1) for k, v in scores.items()},
        "signals": list(set(signals[:6])),  # deduplicate, max 6
        "indicators": {
            "adx": round(adx, 2),
            "atr": round(atr, 2),
            "atr_pct": round(atr_pct, 2),
            "rsi": round(rsi, 2),
            "ema_50": round(ema_50, 2),
            "ema_200": round(ema_200, 2),
            "bb_width": round(bb_width, 4),
            "macd": round(macd, 4),
            "plus_di": round(plus_di, 2),
            "minus_di": round(minus_di, 2),
            "volume_surge": volume_surge,
        },
    }

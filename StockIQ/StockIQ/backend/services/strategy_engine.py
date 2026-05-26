"""
Strategy Recommendation Engine.

Maps detected market regimes to optimal trading strategies.
Each strategy includes:
- Name & code
- Explanation of WHY it was selected
- Entry/exit rules
- Indicators to watch
- Risk parameters
"""

from typing import Dict, Any

STRATEGY_MAP = {
    "TRENDING_UP": {
        "code": "TREND_FOLLOW_LONG",
        "name": "Trend Following — Long",
        "category": "Momentum",
        "risk_level": "Medium",
        "timeframe": "Swing / Positional (1–4 weeks)",
        "why": (
            "The stock shows strong directional momentum (ADX > 25) with EMA50 above EMA200 — "
            "classic Golden Cross formation. In trending markets, the edge comes from riding "
            "the trend, not fighting it. This strategy aligns with market momentum."
        ),
        "entry_rules": [
            "Enter long on a pullback to EMA20 or EMA50 in uptrend",
            "Confirm: MACD line above Signal line",
            "Confirm: RSI between 50–70 (not overbought)",
            "Volume above 20-day average on breakout candle",
        ],
        "exit_rules": [
            "Trail stop below EMA50",
            "Exit if ADX drops below 20 (trend weakening)",
            "Target: 1.5x–2x ATR from entry",
        ],
        "indicators": ["EMA 50/200", "MACD", "ADX", "RSI", "Volume"],
        "risk_reward": "1:2 minimum",
        "position_size": "Full position (2% risk per trade)",
    },
    "TRENDING_DOWN": {
        "code": "TREND_FOLLOW_SHORT",
        "name": "Trend Following — Short / Hedge",
        "category": "Momentum",
        "risk_level": "High",
        "timeframe": "Swing (1–3 weeks)",
        "why": (
            "EMA50 crossed below EMA200 (Death Cross). Strong bearish ADX confirms sellers "
            "are in control. This is a high-probability short setup. For Indian retail investors, "
            "consider inverse ETFs or reduce long exposure rather than direct shorting."
        ),
        "entry_rules": [
            "Short on bounce to EMA20 in downtrend",
            "Confirm: MACD below Signal line, both below zero",
            "Confirm: -DI > +DI by >5 points",
        ],
        "exit_rules": [
            "Cover if price closes above EMA50",
            "Target: previous swing low",
            "Hard stop: 2x ATR above entry",
        ],
        "indicators": ["EMA 50/200", "MACD", "ADX", "-DI/+DI"],
        "risk_reward": "1:1.5 minimum",
        "position_size": "Reduced (1.5% risk per trade)",
    },
    "RANGE_BOUND": {
        "code": "MEAN_REVERSION",
        "name": "Mean Reversion — Range Trading",
        "category": "Mean Reversion",
        "risk_level": "Low-Medium",
        "timeframe": "Intraday to Short-swing (1–5 days)",
        "why": (
            "ADX below 20 confirms no strong trend. Bollinger Bands are squeezed, indicating "
            "price compression. In range-bound markets, the statistical edge lies in buying "
            "the dip and selling the rip — RSI and BB extremes define entry zones."
        ),
        "entry_rules": [
            "Buy at/near lower Bollinger Band (BB%B < 0.1)",
            "Confirm: RSI < 35 (oversold in range)",
            "Sell at/near upper Bollinger Band (BB%B > 0.9)",
            "Confirm: RSI > 65 (overbought in range)",
        ],
        "exit_rules": [
            "Take profit at midline (SMA20) or opposite band",
            "Stop: 1x ATR beyond the band",
        ],
        "indicators": ["Bollinger Bands", "RSI", "ADX", "SMA20"],
        "risk_reward": "1:1.5",
        "position_size": "Moderate (1% risk per trade)",
    },
    "VOLATILE": {
        "code": "VOLATILITY_BREAKOUT",
        "name": "Volatility Breakout / Options Strategy",
        "category": "Volatility",
        "risk_level": "High",
        "timeframe": "Short-term (1–3 days)",
        "why": (
            "ATR is above the 75th historical percentile, indicating elevated volatility. "
            "High-volatility environments offer opportunities for breakout strategies. "
            "For options traders: implied volatility premium makes selling options (Iron Condor, "
            "Strangle) attractive if IV is elevated relative to HV."
        ),
        "entry_rules": [
            "Buy on breakout above recent 10-day high with volume >1.5x average",
            "Short on breakdown below recent 10-day low",
            "Options: Sell OTM strangle if IV rank > 50",
        ],
        "exit_rules": [
            "Tight stops (0.5x ATR)",
            "Scale out quickly — volatility can reverse",
        ],
        "indicators": ["ATR", "Bollinger Band Width", "Volume", "RSI"],
        "risk_reward": "Use asymmetric sizing — small risk, large potential",
        "position_size": "Small (0.5%–1% risk per trade)",
    },
    "BREAKOUT": {
        "code": "MOMENTUM_BREAKOUT",
        "name": "Momentum Breakout Entry",
        "category": "Breakout",
        "risk_level": "Medium-High",
        "timeframe": "Swing (days to weeks)",
        "why": (
            "Volume surge combined with Bollinger Band expansion signals a high-energy breakout. "
            "This is often the start of a new trending phase. Early entry with confirmation "
            "offers asymmetric risk-reward. Wait for a small consolidation/pullback to confirm "
            "the breakout is sustainable."
        ),
        "entry_rules": [
            "Enter on breakout bar close above resistance with 1.5x volume",
            "Or enter on first pullback after breakout (lower-risk)",
            "Confirm: MACD crossing Signal line upward",
        ],
        "exit_rules": [
            "Stop below breakout bar low",
            "Trail stop as price moves with ADX",
            "Target: measured move = range height added to breakout point",
        ],
        "indicators": ["Volume", "Bollinger Bands", "MACD", "ADX", "Price Action"],
        "risk_reward": "1:3 potential (high conviction setup)",
        "position_size": "Full position on confirmation",
    },
    "MEAN_REVERTING": {
        "code": "STAT_ARB_REVERSION",
        "name": "Statistical Mean Reversion",
        "category": "Mean Reversion",
        "risk_level": "Low",
        "timeframe": "Short-term (1–7 days)",
        "why": (
            "Statistical analysis shows the stock's returns have a negative autocorrelation — "
            "up moves tend to be followed by down moves and vice versa. RSI in extreme territory "
            "without a clear trend (low ADX) creates a high-probability reversion opportunity."
        ),
        "entry_rules": [
            "Long when RSI < 35 and price >2 std deviations below 20-day mean",
            "Short when RSI > 65 and price >2 std deviations above 20-day mean",
            "Best in sectors known for mean reversion (FMCG, Pharma, Banking)",
        ],
        "exit_rules": [
            "Exit when price returns to 20-day SMA",
            "Hard stop at 3 standard deviations from mean",
        ],
        "indicators": ["RSI", "Z-score", "BB", "SMA20", "ADX"],
        "risk_reward": "1:1.2–1:1.8",
        "position_size": "Moderate",
    },
}


def get_strategy_recommendation(regime: str, indicators: dict, regime_confidence: float) -> Dict[str, Any]:
    """
    Return the optimal strategy for the detected regime.

    Args:
        regime: Detected regime code (e.g., 'TRENDING_UP')
        indicators: Dict of indicator values
        regime_confidence: Confidence score from regime detector (0-100)

    Returns:
        Strategy dict with full recommendation details
    """
    strategy = STRATEGY_MAP.get(regime, STRATEGY_MAP["RANGE_BOUND"]).copy()

    # Adjust confidence based on regime confidence + indicator alignment
    confidence = regime_confidence
    
    # Bonus for strong indicator alignment
    rsi = indicators.get("rsi", 50)
    adx = indicators.get("adx", 15)
    
    if regime in ("TRENDING_UP", "TRENDING_DOWN") and adx > 30:
        confidence = min(confidence + 5, 97)
    
    if regime == "RANGE_BOUND" and (rsi > 60 or rsi < 40):
        confidence = min(confidence + 5, 97)
    
    if regime == "BREAKOUT" and indicators.get("volume_surge"):
        confidence = min(confidence + 8, 97)

    strategy["confidence"] = round(confidence, 1)
    strategy["regime"] = regime
    
    # Add current indicator context to make recommendation actionable
    strategy["current_context"] = _build_context(regime, indicators)
    
    return strategy


def _build_context(regime: str, indicators: dict) -> dict:
    """Build actionable context based on current indicator values."""
    rsi = indicators.get("rsi", 50)
    adx = indicators.get("adx", 15)
    ema_50 = indicators.get("ema_50", 0)
    ema_200 = indicators.get("ema_200", 0)
    bb_width = indicators.get("bb_width", 0.05)
    atr_pct = indicators.get("atr_pct", 2)
    
    context = {}
    
    if regime == "TRENDING_UP":
        context["strength"] = "Very Strong" if adx > 40 else "Strong" if adx > 25 else "Moderate"
        context["ema_gap_pct"] = round(((ema_50 - ema_200) / ema_200 * 100), 2) if ema_200 > 0 else 0
        context["rsi_status"] = "Overbought — wait for pullback" if rsi > 70 else "Good entry zone" if rsi < 60 else "Neutral"
        
    elif regime == "RANGE_BOUND":
        context["band_position"] = "Near Lower Band (Buy Zone)" if rsi < 40 else "Near Upper Band (Sell Zone)" if rsi > 60 else "Middle of Range"
        context["squeeze_intensity"] = "High" if bb_width < 0.02 else "Moderate" if bb_width < 0.04 else "Low"
        
    elif regime == "VOLATILE":
        context["volatility_level"] = "Extreme" if atr_pct > 5 else "High" if atr_pct > 3 else "Elevated"
        context["options_bias"] = "Sell premium (high IV)" if atr_pct > 4 else "Buy options (cheap)"
        
    elif regime == "BREAKOUT":
        context["breakout_quality"] = "High conviction" if indicators.get("volume_surge") else "Moderate — await volume confirmation"
        
    return context

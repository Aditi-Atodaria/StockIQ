"""
News & Sentiment Analysis Service.

Fetches financial news from multiple free sources:
1. Yahoo Finance news via yfinance
2. NewsAPI (requires free API key)
3. Fallback: RSS feeds from MoneyControl / ET Markets

Sentiment analysis: VADER (lexicon-based, no API cost, finance-optimized)
"""

import yfinance as yf
import requests
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from typing import List, Dict, Any
from datetime import datetime, timezone
import os

analyzer = SentimentIntensityAnalyzer()

# Finance-specific lexicon extensions
FINANCE_LEXICON = {
    "bullish": 2.5, "bearish": -2.5, "upgrade": 2.0, "downgrade": -2.0,
    "outperform": 2.0, "underperform": -2.0, "beat": 1.5, "miss": -1.5,
    "squeeze": -1.0, "surge": 2.0, "plunge": -2.5, "soar": 2.5,
    "crash": -3.0, "rally": 2.0, "selloff": -2.5, "breakout": 2.0,
    "resistance": -0.5, "support": 0.5, "overbought": -1.0, "oversold": 1.0,
    "dividend": 1.0, "buyback": 1.5, "default": -3.0, "bankruptcy": -3.0,
    "acquisition": 1.0, "merger": 0.5, "guidance": 0.5, "layoff": -1.5,
}
analyzer.lexicon.update(FINANCE_LEXICON)


def classify_sentiment(compound_score: float) -> str:
    """Convert VADER compound score to sentiment label."""
    if compound_score >= 0.05:
        return "POSITIVE"
    elif compound_score <= -0.05:
        return "NEGATIVE"
    return "NEUTRAL"


def analyze_sentiment(text: str) -> Dict[str, Any]:
    """Analyze sentiment of a text string."""
    scores = analyzer.polarity_scores(text)
    return {
        "compound": round(scores["compound"], 4),
        "positive": round(scores["pos"], 4),
        "negative": round(scores["neg"], 4),
        "neutral": round(scores["neu"], 4),
        "label": classify_sentiment(scores["compound"]),
    }


def fetch_yfinance_news(symbol: str) -> List[Dict[str, Any]]:
    """Fetch news from Yahoo Finance via yfinance."""
    try:
        ticker = yf.Ticker(symbol)
        news = ticker.news or []
        articles = []
        
        for item in news[:15]:  # Limit to 15 most recent
            title = item.get("title", "")
            if not title:
                continue
            
            # Try to get publisher and URL from nested structure
            content = item.get("content", {})
            publisher = (
                item.get("publisher")
                or (content.get("provider", {}) or {}).get("displayName", "Yahoo Finance")
            )
            url = (
                item.get("link")
                or (content.get("clickThroughUrl", {}) or {}).get("url", "#")
            )
            
            # Timestamp
            pub_ts = item.get("providerPublishTime") or item.get("pubDate")
            if pub_ts:
                try:
                    if isinstance(pub_ts, (int, float)):
                        published_at = datetime.fromtimestamp(pub_ts, tz=timezone.utc).isoformat()
                    else:
                        published_at = str(pub_ts)
                except Exception:
                    published_at = datetime.now(timezone.utc).isoformat()
            else:
                published_at = datetime.now(timezone.utc).isoformat()
            
            sentiment = analyze_sentiment(title)
            
            articles.append({
                "title": title,
                "source": publisher,
                "url": url,
                "published_at": published_at,
                "sentiment": sentiment["label"],
                "sentiment_score": sentiment["compound"],
                "sentiment_breakdown": sentiment,
            })
        
        return articles
    except Exception as e:
        print(f"⚠️ yfinance news error for {symbol}: {e}")
        return []


def fetch_newsapi(symbol: str, company_name: str = None) -> List[Dict[str, Any]]:
    """
    Fetch news from NewsAPI (requires NEWSAPI_KEY env var).
    Free tier: 100 requests/day, articles up to 1 month old.
    Get your free key at: https://newsapi.org/register
    """
    api_key = os.getenv("NEWSAPI_KEY")
    if not api_key:
        return []
    
    query = company_name or symbol.replace(".NS", "").replace(".BO", "")
    url = "https://newsapi.org/v2/everything"
    params = {
        "q": f"{query} stock",
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 10,
        "apiKey": api_key,
    }
    
    try:
        resp = requests.get(url, params=params, timeout=10)
        data = resp.json()
        articles = []
        
        for item in data.get("articles", []):
            title = item.get("title", "") or ""
            if "[Removed]" in title or not title:
                continue
            
            description = item.get("description", "") or ""
            full_text = f"{title}. {description}"
            sentiment = analyze_sentiment(full_text)
            
            articles.append({
                "title": title,
                "source": (item.get("source") or {}).get("name", "Unknown"),
                "url": item.get("url", "#"),
                "published_at": item.get("publishedAt", ""),
                "sentiment": sentiment["label"],
                "sentiment_score": sentiment["compound"],
                "sentiment_breakdown": sentiment,
            })
        
        return articles
    except Exception as e:
        print(f"⚠️ NewsAPI error: {e}")
        return []


def get_news_with_sentiment(symbol: str, company_name: str = None) -> Dict[str, Any]:
    """
    Aggregate news from all sources and compute overall sentiment summary.
    
    Returns deduplicated, sentiment-labeled news articles with
    an aggregate sentiment score for the stock.
    """
    # Combine news sources (Yahoo Finance is free and always available)
    articles = fetch_yfinance_news(symbol)
    
    # Try NewsAPI as supplement
    newsapi_articles = fetch_newsapi(symbol, company_name)
    
    # Deduplicate by title
    seen_titles = {a["title"] for a in articles}
    for art in newsapi_articles:
        if art["title"] not in seen_titles:
            articles.append(art)
            seen_titles.add(art["title"])
    
    # Sort by date (newest first)
    articles.sort(key=lambda x: x.get("published_at", ""), reverse=True)
    
    # Compute aggregate sentiment
    if articles:
        scores = [a["sentiment_score"] for a in articles]
        avg_score = sum(scores) / len(scores)
        positive_count = sum(1 for s in scores if s > 0.05)
        negative_count = sum(1 for s in scores if s < -0.05)
        neutral_count = len(scores) - positive_count - negative_count
    else:
        avg_score = 0
        positive_count = negative_count = neutral_count = 0
    
    return {
        "articles": articles[:20],  # Return top 20
        "total": len(articles),
        "aggregate_sentiment": {
            "label": classify_sentiment(avg_score),
            "score": round(avg_score, 4),
            "positive_count": positive_count,
            "negative_count": negative_count,
            "neutral_count": neutral_count,
        },
    }

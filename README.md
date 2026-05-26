# StockIQ — Stock Market Intelligence Platform

A full-stack web application that analyses stocks by detecting their current market behaviour and recommending the right trading strategy for that specific condition — combined with live news sentiment analysis.

Most tools apply the same indicators to every stock. StockIQ doesn't. A momentum stock and a mean-reverting stock require completely different approaches, and this platform figures out which one you're looking at.

---
## Status

Core platform is functional. Currently adding SQLite caching, 
dynamic ticker search, and a regime history timeline.

## What it does

**Regime Detection** — classifies any stock into one of six market 
states: Trending Up, Trending Down, Range Bound, Volatile, Breakout, 
or Mean Reverting. Uses ADX, EMA crossovers, Bollinger Bands, RSI, 
MACD, and volume with a confidence score for each classification.

**Strategy Recommendations** — maps each regime to specific entry/exit 
rules, position sizing, and risk parameters.

**News Sentiment** — aggregates articles from Yahoo Finance and NewsAPI, 
scores them using VADER extended with 25+ finance-specific terms, and 
surfaces sentiment alongside price data.

## How it works

**1. Market State Detection**
Classifies each stock into one of six states using ten technical indicators:

| State | Description |
|---|---|
| Trending Up | Strong uptrend, ADX > 25, EMA50 > EMA200 |
| Trending Down | Confirmed downtrend, bears in control |
| Range Bound | Sideways consolidation, no clear direction |
| Volatile | High ATR, erratic price swings |
| Breakout | Price bursting out of consolidation with volume |
| Mean Reverting | Oscillating around mean, extremes tend to reverse |

Each classification comes with a confidence score (0–100%) and the indicator values that drove it.

**2. Strategy Recommendation Engine**
Maps the detected market state to the optimal trading strategy — with specific entry rules, exit rules, risk parameters, position sizing guidance, and a plain-English explanation of why that strategy fits the current condition.

**3. Live News Sentiment**
Pulls headlines from Yahoo Finance and NewsAPI, runs them through VADER sentiment analysis extended with a custom finance-specific lexicon, and produces a per-stock sentiment score (Positive / Neutral / Negative) across all recent articles.

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, Python 3.11+ |
| Data | yfinance, pandas, pandas-ta |
| Sentiment | VADER Sentiment + custom finance lexicon |
| ML | scikit-learn |
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Charts | Lightweight Charts (candlestick + indicators) |

---

## Project structure

```
.
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── database.py              # DB initialisation
│   ├── requirements.txt
│   ├── .env.example             # Environment variable template
│   ├── routers/
│   │   ├── stock.py             # Per-stock endpoints
│   │   ├── market.py            # Market overview endpoints
│   │   └── search.py            # Search endpoints
│   └── services/
│       ├── data_service.py      # OHLCV data fetching
│       ├── indicators.py        # Technical indicator computation
│       ├── regime_detector.py   # Market state classification engine
│       ├── strategy_engine.py   # Strategy recommendation engine
│       └── news_service.py      # News fetching + sentiment analysis
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Home / search page
│   │   └── stock/[symbol]/      # Stock detail page
│   ├── components/
│   │   ├── CandlestickChart.tsx
│   │   ├── RegimePanel.tsx
│   │   ├── StrategyPanel.tsx
│   │   ├── NewsPanel.tsx
│   │   ├── MarketTicker.tsx
│   │   ├── IndicatorChart.tsx
│   │   ├── StockCard.tsx
│   │   ├── Navbar.tsx
│   │   └── Icons.tsx
│   ├── lib/
│   │   ├── api.ts               # API client
│   │   └── utils.ts
│   └── package.json
└── start.py                     # One-command startup script
```

---

## API endpoints

```
GET /api/stock/{symbol}/ohlcv        → Candlestick time-series data
GET /api/stock/{symbol}/indicators   → All technical indicators
GET /api/stock/{symbol}/regime       → Market state + confidence score
GET /api/stock/{symbol}/strategy     → Strategy recommendation
GET /api/stock/{symbol}/news         → Headlines + sentiment
GET /api/stock/{symbol}/full         → Everything in one call
GET /api/stock/{symbol}/info         → Stock metadata
```

Supports NSE symbols (e.g. `RELIANCE.NS`, `TCS.NS`, `INFY.NS`) and US tickers (e.g. `AAPL`, `TSLA`).

---

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm

### 1. Clone the repo

```bash
git clone https://github.com/your-username/stockiq.git
cd stockiq
```

### 2. Backend setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your NewsAPI key to .env (optional — Yahoo Finance works without it)
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

### 4. Run both together

```bash
# From the root directory
python start.py
```

Or run separately:

```bash
# Terminal 1 — Backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Environment variables

Create a `.env` file in the `backend/` directory:

```env
NEWSAPI_KEY=your_key_here
# Get a free key at https://newsapi.org/register
# Optional — Yahoo Finance news is used as fallback
```

---

## Indicators computed

ADX, EMA (20 / 50 / 200), Bollinger Bands (width + percentile), RSI (14), MACD (line + signal + histogram), ATR, Volume (surge detection), VWAP

---

## Status

Work in progress. Core detection engine and strategy layer are functional. Backtesting layer in development.

---

## Author

Aditi — [@Aditi-Atodaria](https://github.com/Aditi-Atodaria)

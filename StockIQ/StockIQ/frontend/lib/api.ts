/**
 * Centralized API client for the Stock Intelligence backend.
 * All fetch calls go through /api/* which Next.js proxies to FastAPI (localhost:8000).
 */

const BASE = '/api';

export interface OHLCVData {
  symbol: string;
  period: string;
  interval: string;
  count: number;
  timestamps: string[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

export interface IndicatorLatest {
  rsi: number | null;
  macd: number | null;
  macd_signal: number | null;
  macd_hist: number | null;
  ema_20: number | null;
  ema_50: number | null;
  ema_200: number | null;
  bb_upper: number | null;
  bb_mid: number | null;
  bb_lower: number | null;
  bb_width: number | null;
  atr: number | null;
  adx: number | null;
  plus_di: number | null;
  minus_di: number | null;
}

export interface RegimeData {
  symbol: string;
  regime: string;
  label: string;
  color: string;
  description: string;
  confidence: number;
  scores: Record<string, number>;
  signals: string[];
  indicators: Record<string, number | boolean>;
}

export interface StrategyData {
  symbol: string;
  code: string;
  name: string;
  category: string;
  risk_level: string;
  timeframe: string;
  why: string;
  entry_rules: string[];
  exit_rules: string[];
  indicators: string[];
  risk_reward: string;
  position_size: string;
  confidence: number;
  current_context: Record<string, string | number>;
  regime_details: {
    regime: string;
    label: string;
    color: string;
    signals: string[];
  };
}

export interface NewsArticle {
  title: string;
  source: string;
  url: string;
  published_at: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  sentiment_score: number;
  sentiment_breakdown?: Record<string, number>;
}

export interface NewsData {
  symbol: string;
  articles: NewsArticle[];
  total: number;
  aggregate_sentiment: {
    label: string;
    score: number;
    positive_count: number;
    negative_count: number;
    neutral_count: number;
  };
}

export interface StockInfo {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry?: string;
  market_cap?: number;
  currency?: string;
  current_price?: number;
  previous_close?: number;
  day_high?: number;
  day_low?: number;
  '52w_high'?: number;
  '52w_low'?: number;
  pe_ratio?: number;
  beta?: number;
}

export interface FullAnalysis {
  symbol: string;
  info: StockInfo;
  ohlcv: {
    timestamps: string[];
    open: number[];
    high: number[];
    low: number[];
    close: number[];
    volume: number[];
  };
  indicators: {
    latest: IndicatorLatest;
    series: Record<string, number[]>;
  };
  regime: RegimeData;
  strategy: StrategyData;
  news: NewsData;
}

export interface Mover {
  symbol: string;
  name: string;
  price: number;
  change_pct: number;
  change_abs: number;
}

export interface PopularStock {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

export const api = {
  getFullAnalysis: (symbol: string, period = '6mo') =>
    apiFetch<FullAnalysis>(`/stock/${symbol}/full?period=${period}`),

  getOHLCV: (symbol: string, period = '6mo', interval = '1d') =>
    apiFetch<OHLCVData>(`/stock/${symbol}/ohlcv?period=${period}&interval=${interval}`),

  getRegime: (symbol: string) =>
    apiFetch<RegimeData>(`/stock/${symbol}/regime`),

  getStrategy: (symbol: string) =>
    apiFetch<StrategyData>(`/stock/${symbol}/strategy`),

  getNews: (symbol: string) =>
    apiFetch<NewsData>(`/stock/${symbol}/news`),

  getInfo: (symbol: string) =>
    apiFetch<StockInfo>(`/stock/${symbol}/info`),

  getMovers: () =>
    apiFetch<{ gainers: Mover[]; losers: Mover[] }>('/market/movers'),

  getPopular: () =>
    apiFetch<{ stocks: PopularStock[] }>('/market/popular'),

  search: (q: string) =>
    apiFetch<{ query: string; results: PopularStock[] }>(`/search?q=${encodeURIComponent(q)}`),
};

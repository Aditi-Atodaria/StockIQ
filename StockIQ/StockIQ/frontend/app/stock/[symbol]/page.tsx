'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, FullAnalysis } from '@/lib/api';
import {
  formatPrice, formatPct, formatINR, formatCompact,
  colorClass, regimeBadgeClass, sentimentBadgeClass,
  timeAgo, confidenceColor, rsiLabel, macdLabel
} from '@/lib/utils';
import Navbar from '@/components/Navbar';
import CandlestickChart from '@/components/CandlestickChart';
import IndicatorChart from '@/components/IndicatorChart';
import RegimePanel from '@/components/RegimePanel';
import StrategyPanel from '@/components/StrategyPanel';
import NewsPanel from '@/components/NewsPanel';
import { InformationCircleIcon } from '@/components/Icons';

const PERIODS = ['1mo', '3mo', '6mo', '1y', '2y'];
const TABS = ['Overview', 'Indicators', 'Regime', 'Strategy', 'News'];

export default function StockPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const router = useRouter();
  const decodedSymbol = decodeURIComponent(symbol);

  const [data, setData] = useState<FullAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('6mo');
  const [activeTab, setActiveTab] = useState('Overview');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (p: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await api.getFullAnalysis(decodedSymbol, p);
      setData(result);
    } catch (e: any) {
      setError(e.message || 'Failed to load data. Check if the backend is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(period); }, [decodedSymbol, period]);

  const currentPrice = data?.info?.current_price;
  const prevClose = data?.info?.previous_close;
  const priceChange = currentPrice && prevClose ? currentPrice - prevClose : null;
  const priceChangePct = currentPrice && prevClose && prevClose > 0
    ? ((currentPrice - prevClose) / prevClose) * 100 : null;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      {/* Header Bar */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ padding: '16px 24px' }}>
          <div className="flex items-center gap-3" style={{ marginBottom: '12px' }}>
            <button
              onClick={() => router.push('/')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              ← Back
            </button>
            <span style={{ color: 'var(--border-bright)' }}>|</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{decodedSymbol}</span>
          </div>

          <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div className="flex items-center gap-3">
                <h1 style={{ fontSize: '1.5rem' }}>
                  {loading ? <span className="skeleton" style={{ display: 'inline-block', width: '220px', height: '28px' }} /> : (data?.info?.name || decodedSymbol)}
                </h1>
                {data?.info?.exchange && <span className="badge badge-blue">{data.info.exchange}</span>}
                {data?.info?.sector && <span className="badge badge-purple hide-mobile">{data.info.sector}</span>}
              </div>
              <div style={{ marginTop: '6px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{decodedSymbol}</div>
            </div>

            {/* Price */}
            <div style={{ textAlign: 'right' }}>
              {loading ? (
                <div className="skeleton" style={{ width: '140px', height: '36px', borderRadius: '6px' }} />
              ) : currentPrice ? (
                <>
                  <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                    ₹{formatPrice(currentPrice)}
                  </div>
                  <div className={`flex items-center gap-2 ${colorClass(priceChange)}`} style={{ marginTop: '4px', justifyContent: 'flex-end' }}>
                    <span style={{ fontWeight: 600 }}>{priceChange && priceChange > 0 ? '▲' : '▼'} {formatPct(priceChangePct)}</span>
                    <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>({priceChange !== null ? (priceChange > 0 ? '+' : '') + formatPrice(priceChange) : '—'})</span>
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Price unavailable</div>
              )}
            </div>
          </div>
        </div>

        {/* Period Selector + Tabs */}
        <div className="container" style={{ padding: '0 24px' }}>
          <div className="flex items-center justify-between" style={{ borderTop: '1px solid var(--border)', paddingTop: '0' }}>
            <div className="flex" style={{ gap: '0' }}>
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '12px 16px', fontSize: '0.875rem', fontWeight: 500,
                    color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                    borderBottom: activeTab === tab ? '2px solid var(--accent-blue)' : '2px solid transparent',
                    transition: 'var(--transition)',
                  }}
                >{tab}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {PERIODS.map(p => (
                <button
                  key={p}
                  className={`chip btn-sm ${period === p ? 'active' : ''}`}
                  onClick={() => setPeriod(p)}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >{p}</button>
              ))}
              <button
                onClick={() => fetchData(period, true)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                disabled={refreshing}
              >
                {refreshing ? '⟳' : '↺'} Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container" style={{ padding: '24px' }}>
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '12px', padding: '16px 20px', marginBottom: '24px',
            color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 600 }}>Error loading data</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{error}</div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.6 }}>
                Make sure the FastAPI backend is running on port 8000: <code>uvicorn main:app --reload</code>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Overview' && (
          <OverviewTab data={data} loading={loading} />
        )}
        {activeTab === 'Indicators' && (
          <IndicatorsTab data={data} loading={loading} />
        )}
        {activeTab === 'Regime' && (
          <RegimePanel regime={data?.regime || null} loading={loading} />
        )}
        {activeTab === 'Strategy' && (
          <StrategyPanel strategy={data?.strategy || null} loading={loading} />
        )}
        {activeTab === 'News' && (
          <NewsPanel news={data?.news || null} loading={loading} />
        )}
      </div>
    </div>
  );
}

/* ─────── Overview Tab ─────── */
function OverviewTab({ data, loading }: { data: FullAnalysis | null; loading: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
      {/* Left */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Candlestick Chart */}
        <div className="card" style={{ padding: '20px' }}>
          <div className="section-header">Price Chart</div>
          {loading ? (
            <div className="skeleton" style={{ height: '380px', borderRadius: '8px' }} />
          ) : data?.ohlcv ? (
            <CandlestickChart
              timestamps={data.ohlcv.timestamps}
              open={data.ohlcv.open}
              high={data.ohlcv.high}
              low={data.ohlcv.low}
              close={data.ohlcv.close}
              volume={data.ohlcv.volume}
              ema20={data.indicators.series.ema_20}
              ema50={data.indicators.series.ema_50}
              ema200={data.indicators.series.ema_200}
            />
          ) : (
            <div style={{ height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No chart data</div>
          )}
        </div>

        {/* Quick Indicators Row */}
        {!loading && data?.indicators?.latest && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <IndicatorBox label="RSI (14)" value={data.indicators.latest.rsi?.toFixed(1) || '—'} sub={rsiLabel(data.indicators.latest.rsi)} color={getRsiColor(data.indicators.latest.rsi)} />
            <IndicatorBox label="MACD" value={data.indicators.latest.macd?.toFixed(3) || '—'} sub={macdLabel(data.indicators.latest.macd, data.indicators.latest.macd_signal)} color={data.indicators.latest.macd && data.indicators.latest.macd > 0 ? 'var(--accent-green)' : 'var(--accent-red)'} />
            <IndicatorBox label="ADX" value={data.indicators.latest.adx?.toFixed(1) || '—'} sub={getAdxLabel(data.indicators.latest.adx)} color="var(--accent-blue)" />
            <IndicatorBox label="ATR" value={data.indicators.latest.atr?.toFixed(2) || '—'} sub="Volatility" color="var(--accent-purple)" />
          </div>
        )}

        {/* Regime + Strategy Quick View */}
        {!loading && data?.regime && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="card" style={{ background: `${data.regime.color}12`, borderColor: `${data.regime.color}33` }}>
              <div className="section-header">Market Regime</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '6px' }}>{data.regime.label}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>{data.regime.description}</div>
              <ConfidenceBar score={data.regime.confidence} />
            </div>
            <div className="card" style={{ background: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.2)' }}>
              <div className="section-header">Suggested Strategy</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>{data.strategy?.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{data.strategy?.category} • {data.strategy?.risk_level} Risk</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{data.strategy?.timeframe}</div>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Stock Info */}
        <div className="card">
          <div className="section-header">Stock Info</div>
          {loading ? <InfoSkeleton /> : data?.info && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <InfoRow label="Market Cap" value={formatINR(data.info.market_cap)} />
              <InfoRow label="52W High" value={`₹${formatPrice(data.info['52w_high'])}`} />
              <InfoRow label="52W Low" value={`₹${formatPrice(data.info['52w_low'])}`} />
              <InfoRow label="Day High" value={`₹${formatPrice(data.info.day_high)}`} color="var(--accent-green)" />
              <InfoRow label="Day Low" value={`₹${formatPrice(data.info.day_low)}`} color="var(--accent-red)" />
              <InfoRow label="P/E Ratio" value={data.info.pe_ratio ? data.info.pe_ratio.toFixed(2) : '—'} />
              <InfoRow label="Beta" value={data.info.beta ? data.info.beta.toFixed(2) : '—'} />
              <InfoRow label="Sector" value={data.info.sector || '—'} />
            </div>
          )}
        </div>

        {/* News Sentiment Summary */}
        <div className="card">
          <div className="section-header">News Sentiment</div>
          {loading ? <div className="skeleton" style={{ height: '100px' }} /> : data?.news && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <div style={{
                  fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px',
                  color: data.news.aggregate_sentiment.label === 'POSITIVE' ? 'var(--accent-green)'
                    : data.news.aggregate_sentiment.label === 'NEGATIVE' ? 'var(--accent-red)'
                    : 'var(--text-secondary)'
                }}>
                  {data.news.aggregate_sentiment.label}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Based on {data.news.total} articles
                </div>
              </div>
              <SentimentBar
                positive={data.news.aggregate_sentiment.positive_count}
                negative={data.news.aggregate_sentiment.negative_count}
                neutral={data.news.aggregate_sentiment.neutral_count}
              />
            </>
          )}
        </div>

        {/* BB Info */}
        {!loading && data?.indicators?.latest && (
          <div className="card">
            <div className="section-header">Bollinger Bands</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <InfoRow label="Upper" value={`₹${formatPrice(data.indicators.latest.bb_upper)}`} color="var(--accent-red)" />
              <InfoRow label="Middle (SMA)" value={`₹${formatPrice(data.indicators.latest.bb_mid)}`} />
              <InfoRow label="Lower" value={`₹${formatPrice(data.indicators.latest.bb_lower)}`} color="var(--accent-green)" />
              <InfoRow label="Width" value={data.indicators.latest.bb_width ? (data.indicators.latest.bb_width * 100).toFixed(2) + '%' : '—'} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────── Indicators Tab ─────── */
function IndicatorsTab({ data, loading }: { data: FullAnalysis | null; loading: boolean }) {
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '12px' }} />)}
    </div>
  );
  if (!data) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <IndicatorChart title="RSI (14)" data={data.indicators.series.rsi} timestamps={data.ohlcv.timestamps} color="#8b5cf6" referenceLines={[{ y: 70, color: '#ef4444', label: 'Overbought' }, { y: 30, color: '#10b981', label: 'Oversold' }]} min={0} max={100} />
      <IndicatorChart title="MACD" data={data.indicators.series.macd} secondaryData={data.indicators.series.macd_signal} histData={data.indicators.series.macd_hist} timestamps={data.ohlcv.timestamps} color="#3b82f6" secondaryColor="#f59e0b" referenceLines={[{ y: 0, color: 'rgba(255,255,255,0.2)' }]} />
      <IndicatorChart title="ADX (Trend Strength)" data={data.indicators.series.adx} timestamps={data.ohlcv.timestamps} color="#06b6d4" referenceLines={[{ y: 25, color: '#f59e0b', label: 'Strong Trend' }, { y: 20, color: 'rgba(255,255,255,0.2)', label: 'Weak' }]} min={0} max={100} />
      <IndicatorChart title="ATR (Volatility)" data={data.indicators.series.atr} timestamps={data.ohlcv.timestamps} color="#f97316" />
    </div>
  );
}

/* ─────── Small helper components ─────── */
function IndicatorBox({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
      <div className="stat-label">{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color, lineHeight: 1.2, margin: '4px 0' }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center" style={{ gap: '8px' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: color || 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  );
}

function ConfidenceBar({ score }: { score: number }) {
  const color = confidenceColor(score);
  return (
    <div>
      <div className="flex justify-between" style={{ marginBottom: '4px' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Confidence</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{score}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
      </div>
    </div>
  );
}

function SentimentBar({ positive, negative, neutral }: { positive: number; negative: number; neutral: number }) {
  const total = positive + negative + neutral || 1;
  return (
    <div>
      <div style={{ display: 'flex', height: '8px', borderRadius: '999px', overflow: 'hidden', gap: '2px' }}>
        <div style={{ width: `${(positive / total) * 100}%`, background: 'var(--accent-green)', borderRadius: '999px 0 0 999px' }} />
        <div style={{ width: `${(neutral / total) * 100}%`, background: 'var(--accent-yellow)' }} />
        <div style={{ width: `${(negative / total) * 100}%`, background: 'var(--accent-red)', borderRadius: '0 999px 999px 0' }} />
      </div>
      <div className="flex justify-between" style={{ marginTop: '8px' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--accent-green)' }}>+{positive} positive</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--accent-yellow)' }}>{neutral} neutral</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--accent-red)' }}>{negative} negative</span>
      </div>
    </div>
  );
}

function InfoSkeleton() {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: '18px' }} />)}
  </div>;
}

function getRsiColor(rsi: number | null): string {
  if (!rsi) return 'var(--text-secondary)';
  if (rsi > 70) return 'var(--accent-red)';
  if (rsi < 30) return 'var(--accent-green)';
  return 'var(--accent-blue)';
}

function getAdxLabel(adx: number | null): string {
  if (!adx) return '—';
  if (adx > 40) return 'Very Strong';
  if (adx > 25) return 'Strong Trend';
  if (adx > 20) return 'Moderate';
  return 'Weak / No Trend';
}

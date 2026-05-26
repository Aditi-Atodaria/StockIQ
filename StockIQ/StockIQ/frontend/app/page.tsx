'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, Mover, PopularStock } from '@/lib/api';
import { formatPrice, formatPct, colorClass } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import MarketTicker from '@/components/MarketTicker';
import StockCard from '@/components/StockCard';

const SECTORS = ['All', 'IT', 'Banking', 'FMCG', 'Automobile', 'Pharma', 'Energy', 'Finance', 'Telecom'];

export default function HomePage() {
  const router = useRouter();
  const [movers, setMovers] = useState<{ gainers: Mover[]; losers: Mover[] } | null>(null);
  const [popular, setPopular] = useState<PopularStock[]>([]);
  const [filtered, setFiltered] = useState<PopularStock[]>([]);
  const [activeSector, setActiveSector] = useState('All');
  const [loading, setLoading] = useState(true);
  const [moversLoading, setMoversLoading] = useState(true);

  useEffect(() => {
    api.getPopular().then(d => {
      setPopular(d.stocks);
      setFiltered(d.stocks);
      setLoading(false);
    }).catch(() => setLoading(false));

    api.getMovers().then(d => {
      setMovers(d);
      setMoversLoading(false);
    }).catch(() => setMoversLoading(false));
  }, []);

  const filterSector = useCallback((sector: string) => {
    setActiveSector(sector);
    if (sector === 'All') setFiltered(popular);
    else setFiltered(popular.filter(s => s.sector === sector));
  }, [popular]);

  const handleStockClick = (symbol: string) => {
    router.push(`/stock/${encodeURIComponent(symbol)}`);
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <MarketTicker />

      <main className="container" style={{ padding: '32px 24px 80px' }}>
        {/* Hero */}
        <div style={{ marginBottom: '48px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '999px', padding: '4px 16px', marginBottom: '20px' }}>
            <span className="pulse-dot" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-accent)', fontWeight: 600 }}>AI-Powered Market Intelligence • Live</span>
          </div>
          <h1 style={{ marginBottom: '12px' }}>
            Decode Markets with{' '}
            <span style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AI Intelligence
            </span>
          </h1>
          <p style={{ maxWidth: '560px', margin: '0 auto', fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
            Real-time regime detection, strategy recommendations & sentiment analysis for NSE, BSE & global markets.
          </p>
        </div>

        {/* Market Movers */}
        <section style={{ marginBottom: '40px' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.1rem' }}>Market Movers</h2>
            <span className="badge badge-green">NSE</span>
          </div>

          {moversLoading ? (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {[...Array(10)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />
              ))}
            </div>
          ) : movers ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {/* Gainers */}
              <div className="card">
                <div className="section-header" style={{ color: 'var(--accent-green)', marginBottom: '12px' }}>🚀 Top Gainers</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {movers.gainers.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Data unavailable</p>
                  ) : movers.gainers.map((m) => (
                    <MoverRow key={m.symbol} mover={m} onClick={() => handleStockClick(m.symbol)} />
                  ))}
                </div>
              </div>
              {/* Losers */}
              <div className="card">
                <div className="section-header" style={{ color: 'var(--accent-red)', marginBottom: '12px' }}>📉 Top Losers</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {movers.losers.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Data unavailable</p>
                  ) : movers.losers.map((m) => (
                    <MoverRow key={m.symbol} mover={m} onClick={() => handleStockClick(m.symbol)} />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {/* Sector Filter */}
        <div style={{ marginBottom: '20px' }}>
          <div className="flex" style={{ gap: '8px', flexWrap: 'wrap' }}>
            {SECTORS.map(s => (
              <button
                key={s}
                className={`chip ${activeSector === s ? 'active' : ''}`}
                onClick={() => filterSector(s)}
              >{s}</button>
            ))}
          </div>
        </div>

        {/* Stocks Grid */}
        <section>
          <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.1rem' }}>Watchlist</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filtered.length} stocks</span>
          </div>

          {loading ? (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '130px', borderRadius: '16px' }} />
              ))}
            </div>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {filtered.map(stock => (
                <StockCard
                  key={stock.symbol}
                  stock={stock}
                  onClick={() => handleStockClick(stock.symbol)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function MoverRow({ mover, onClick }: { mover: Mover; onClick: () => void }) {
  const isPositive = mover.change_pct >= 0;
  return (
    <div
      className="scroll-list-item"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{mover.name}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{mover.symbol}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
          ₹{formatPrice(mover.price)}
        </div>
        <div className={isPositive ? 'positive' : 'negative'} style={{ fontSize: '0.78rem', fontWeight: 600 }}>
          {formatPct(mover.change_pct)}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { api, Mover } from '@/lib/api';
import { formatPrice, formatPct } from '@/lib/utils';

export default function MarketTicker() {
  const [movers, setMovers] = useState<Mover[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getMovers()
      .then(d => setMovers([...d.gainers, ...d.losers]))
      .catch(() => {});
  }, []);

  // Duplicate for seamless loop
  const items = [...movers, ...movers];

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      overflow: 'hidden',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
    }}>
      <div style={{
        flexShrink: 0,
        padding: '0 14px',
        fontSize: '0.7rem',
        fontWeight: 700,
        color: 'var(--text-muted)',
        letterSpacing: '0.08em',
        borderRight: '1px solid var(--border)',
        whiteSpace: 'nowrap',
      }}>LIVE</div>

      <div style={{ overflow: 'hidden', flex: 1 }}>
        {movers.length === 0 ? (
          <div style={{ padding: '0 20px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Loading market data…
          </div>
        ) : (
          <div
            ref={scrollRef}
            style={{
              display: 'flex',
              gap: '40px',
              whiteSpace: 'nowrap',
              animation: 'tickerScroll 40s linear infinite',
              paddingLeft: '20px',
            }}
          >
            {items.map((m, i) => {
              const isPos = m.change_pct >= 0;
              return (
                <span key={`${m.symbol}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{m.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>₹{formatPrice(m.price)}</span>
                  <span style={{ color: isPos ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                    {isPos ? '▲' : '▼'} {formatPct(Math.abs(m.change_pct), 2)}
                  </span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

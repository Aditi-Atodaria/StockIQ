'use client';

import { useState, useEffect } from 'react';
import { api, StockInfo } from '@/lib/api';
import { PopularStock } from '@/lib/api';
import { formatPrice, formatPct, colorClass } from '@/lib/utils';

interface StockCardProps {
  stock: PopularStock;
  onClick: () => void;
}

export default function StockCard({ stock, onClick }: StockCardProps) {
  const [info, setInfo] = useState<StockInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getInfo(stock.symbol)
      .then(d => { setInfo(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [stock.symbol]);

  const price = info?.current_price;
  const prev = info?.previous_close;
  const changePct = price && prev && prev > 0 ? ((price - prev) / prev) * 100 : null;
  const isPos = changePct !== null && changePct >= 0;

  return (
    <div
      className="card"
      onClick={onClick}
      style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
    >
      {/* Color accent top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: changePct === null ? 'var(--border)' : isPos
          ? 'linear-gradient(90deg, #10b981, #06b6d4)'
          : 'linear-gradient(90deg, #ef4444, #f97316)',
      }} />

      <div className="flex justify-between items-center">
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '2px' }}>
            {stock.symbol.replace('.NS', '').replace('.BO', '')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {stock.name}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {loading ? (
            <div className="skeleton" style={{ width: '80px', height: '28px' }} />
          ) : price ? (
            <>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '1.05rem' }}>
                ₹{formatPrice(price)}
              </div>
              <div className={isPos ? 'positive' : 'negative'} style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                {isPos ? '▲' : '▼'} {formatPct(Math.abs(changePct || 0))}
              </div>
            </>
          ) : (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>—</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2" style={{ marginTop: '12px' }}>
        <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>{stock.exchange}</span>
        <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{stock.sector}</span>
      </div>
    </div>
  );
}

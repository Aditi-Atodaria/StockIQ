'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, PopularStock } from '@/lib/api';

export default function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PopularStock[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<NodeJS.Timeout>();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (val: string) => {
    setQuery(val);
    clearTimeout(debounce.current);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    debounce.current = setTimeout(async () => {
      try {
        const d = await api.search(val);
        setResults(d.results);
        setOpen(true);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
  };

  const go = (symbol: string) => {
    setQuery('');
    setOpen(false);
    setResults([]);
    router.push(`/stock/${encodeURIComponent(symbol)}`);
  };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(10,14,26,0.9)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div className="container flex items-center justify-between" style={{ padding: '12px 24px', gap: '24px' }}>
        {/* Logo */}
        <button
          onClick={() => router.push('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
        >
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', boxShadow: '0 0 16px rgba(59,130,246,0.4)',
          }}>📈</div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            Stock<span style={{ color: 'var(--accent-cyan)' }}>IQ</span>
          </span>
        </button>

        {/* Search */}
        <div ref={ref} style={{ flex: 1, maxWidth: '480px', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', fontSize: '1rem', pointerEvents: 'none',
            }}>🔍</span>
            <input
              className="input"
              style={{ paddingLeft: '38px' }}
              placeholder="Search stocks… (e.g. RELIANCE, TCS, AAPL)"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && query.trim()) go(query.trim().toUpperCase());
              }}
            />
            {loading && (
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>⟳</span>
            )}
          </div>

          {/* Dropdown */}
          {open && results.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
              background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
              borderRadius: '12px', boxShadow: 'var(--shadow-lg)',
              zIndex: 200, overflow: 'hidden',
            }}>
              {results.map(r => (
                <button
                  key={r.symbol}
                  onClick={() => go(r.symbol)}
                  style={{
                    width: '100%', background: 'none', border: 'none',
                    padding: '12px 16px', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid var(--border)', transition: 'var(--transition)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{r.symbol}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>{r.exchange}</span>
                    <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{r.sector}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 hide-mobile">
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            NSE • BSE • US
          </span>
          <span className="pulse-dot" />
        </div>
      </div>
    </nav>
  );
}

'use client';

import { RegimeData } from '@/lib/api';
import { confidenceColor, regimeBadgeClass } from '@/lib/utils';

interface RegimePanelProps {
  regime: RegimeData | null;
  loading: boolean;
}

const REGIME_ICONS: Record<string, string> = {
  TRENDING_UP: '📈',
  TRENDING_DOWN: '📉',
  RANGE_BOUND: '↔️',
  VOLATILE: '⚡',
  BREAKOUT: '🚀',
  MEAN_REVERTING: '🔄',
};

const ALL_REGIMES = ['TRENDING_UP', 'TRENDING_DOWN', 'RANGE_BOUND', 'VOLATILE', 'BREAKOUT', 'MEAN_REVERTING'];

export default function RegimePanel({ regime, loading }: RegimePanelProps) {
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '12px' }} />
      ))}
    </div>
  );
  if (!regime) return <div style={{ color: 'var(--text-muted)' }}>No regime data available.</div>;

  const confColor = confidenceColor(regime.confidence);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
      {/* Main Regime Card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="card" style={{
          background: `linear-gradient(135deg, ${regime.color}18, transparent)`,
          borderColor: `${regime.color}44`,
          padding: '28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px', flexShrink: 0,
              background: `${regime.color}22`, border: `1px solid ${regime.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem',
            }}>
              {REGIME_ICONS[regime.regime] || '📊'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                Detected Regime
              </div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', color: regime.color }}>{regime.label}</h2>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{regime.description}</p>
            </div>
          </div>

          {/* Confidence */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Confidence Score</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: confColor, fontFamily: 'var(--font-mono)' }}>
                {regime.confidence}%
              </span>
            </div>
            <div className="progress-bar" style={{ height: '8px' }}>
              <div className="progress-fill" style={{
                width: `${regime.confidence}%`,
                background: `linear-gradient(90deg, ${confColor}88, ${confColor})`,
              }} />
            </div>
          </div>
        </div>

        {/* Signals */}
        <div className="card">
          <div className="section-header">Detected Signals</div>
          {regime.signals.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No signals detected.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {regime.signals.map((sig, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', background: 'var(--bg-secondary)',
                  borderRadius: '8px', border: '1px solid var(--border)',
                }}>
                  <span style={{ color: regime.color, fontSize: '1rem' }}>✓</span>
                  <span style={{ fontSize: '0.875rem' }}>{sig}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Indicator Values */}
        <div className="card">
          <div className="section-header">Key Indicator Values</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {Object.entries(regime.indicators)
              .filter(([k, v]) => typeof v === 'number')
              .map(([key, val]) => (
                <div key={key} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem' }}>
                    {typeof val === 'number' ? val.toFixed(2) : String(val)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Scores Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="card">
          <div className="section-header">Regime Score Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {ALL_REGIMES.map(r => {
              const score = regime.scores[r] || 0;
              const isActive = r === regime.regime;
              const rColor = isActive ? regime.color : 'rgba(255,255,255,0.15)';
              return (
                <div key={r}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: isActive ? 700 : 400, color: isActive ? regime.color : 'var(--text-secondary)' }}>
                      {REGIME_ICONS[r]} {r.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: isActive ? regime.color : 'var(--text-muted)' }}>
                      {score.toFixed(0)}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div style={{
                      height: '100%', borderRadius: '999px',
                      width: `${score}%`,
                      background: isActive
                        ? `linear-gradient(90deg, ${regime.color}88, ${regime.color})`
                        : 'rgba(255,255,255,0.08)',
                      transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Volume Surge Indicator */}
        <div className="card">
          <div className="section-header">Volume Analysis</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '14px', background: regime.indicators.volume_surge
              ? 'rgba(16,185,129,0.1)' : 'var(--bg-secondary)',
            borderRadius: '10px',
            border: `1px solid ${regime.indicators.volume_surge ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
          }}>
            <span style={{ fontSize: '1.8rem' }}>{regime.indicators.volume_surge ? '🔥' : '💤'}</span>
            <div>
              <div style={{ fontWeight: 700, color: regime.indicators.volume_surge ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                {regime.indicators.volume_surge ? 'Volume Surge Detected' : 'Normal Volume'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {regime.indicators.volume_surge ? '1.5x+ above 20-day average' : 'Within normal range'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

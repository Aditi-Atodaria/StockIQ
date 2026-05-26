'use client';

import { StrategyData } from '@/lib/api';
import { confidenceColor } from '@/lib/utils';

interface StrategyPanelProps {
  strategy: StrategyData | null;
  loading: boolean;
}

const RISK_COLORS: Record<string, string> = {
  Low: '#10b981',
  'Low-Medium': '#06b6d4',
  Medium: '#f59e0b',
  'Medium-High': '#f97316',
  High: '#ef4444',
};

const CATEGORY_ICONS: Record<string, string> = {
  Momentum: '⚡',
  'Mean Reversion': '🔄',
  Volatility: '🌪️',
  Breakout: '🚀',
};

export default function StrategyPanel({ strategy, loading }: StrategyPanelProps) {
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '12px' }} />
      ))}
    </div>
  );
  if (!strategy) return <div style={{ color: 'var(--text-muted)' }}>No strategy data available.</div>;

  const confColor = confidenceColor(strategy.confidence);
  const riskColor = RISK_COLORS[strategy.risk_level] || 'var(--text-muted)';
  const catIcon = CATEGORY_ICONS[strategy.category] || '📊';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Strategy Header */}
        <div className="card" style={{ background: 'rgba(59,130,246,0.07)', borderColor: 'rgba(59,130,246,0.25)', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '14px', flexShrink: 0,
              background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
            }}>
              {catIcon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                Recommended Strategy
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>{strategy.name}</h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <span className="badge badge-blue">{strategy.category}</span>
                <span style={{ ...badgeStyle, color: riskColor, borderColor: riskColor + '44', background: riskColor + '15' }}>
                  {strategy.risk_level} Risk
                </span>
                <span className="badge badge-purple">{strategy.timeframe}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Strategy Confidence</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: confColor, fontSize: '1.2rem' }}>
                  {strategy.confidence}%
                </span>
              </div>
              <div className="progress-bar" style={{ height: '8px' }}>
                <div className="progress-fill" style={{
                  width: `${strategy.confidence}%`,
                  background: `linear-gradient(90deg, ${confColor}88, ${confColor})`,
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Why This Strategy */}
        <div className="card">
          <div className="section-header">🧠 Why This Strategy?</div>
          <p style={{ lineHeight: 1.8, fontSize: '0.9rem' }}>{strategy.why}</p>
          {strategy.current_context && Object.keys(strategy.current_context).length > 0 && (
            <div style={{ marginTop: '16px', padding: '14px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div className="section-header" style={{ marginBottom: '10px' }}>Current Market Context</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(strategy.current_context).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Entry & Exit Rules */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="card">
            <div className="section-header" style={{ color: 'var(--accent-green)' }}>🟢 Entry Rules</div>
            <ol style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {strategy.entry_rules.map((rule, i) => (
                <li key={i} style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{rule}</li>
              ))}
            </ol>
          </div>
          <div className="card">
            <div className="section-header" style={{ color: 'var(--accent-red)' }}>🔴 Exit Rules</div>
            <ol style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {strategy.exit_rules.map((rule, i) => (
                <li key={i} style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{rule}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Risk Params */}
        <div className="card">
          <div className="section-header">Risk Parameters</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <ParamRow icon="⚖️" label="Risk/Reward" value={strategy.risk_reward} />
            <ParamRow icon="📦" label="Position Size" value={strategy.position_size} />
            <ParamRow icon="⏱️" label="Timeframe" value={strategy.timeframe} />
            <ParamRow icon="📊" label="Category" value={strategy.category} />
          </div>
        </div>

        {/* Indicators Used */}
        <div className="card">
          <div className="section-header">Indicators Used</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {strategy.indicators.map((ind, i) => (
              <span key={i} className="badge badge-blue" style={{ fontSize: '0.72rem' }}>{ind}</span>
            ))}
          </div>
        </div>

        {/* Regime Link */}
        {strategy.regime_details && (
          <div className="card">
            <div className="section-header">Based On Regime</div>
            <div style={{
              padding: '12px',
              background: `${strategy.regime_details.color}12`,
              borderRadius: '8px',
              border: `1px solid ${strategy.regime_details.color}33`,
              marginBottom: '10px',
            }}>
              <div style={{ fontWeight: 700, color: strategy.regime_details.color, fontSize: '0.95rem' }}>
                {strategy.regime_details.label}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {strategy.regime_details.signals.slice(0, 4).map((sig, i) => (
                <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px' }}>
                  <span style={{ color: strategy.regime_details.color }}>•</span>
                  {sig}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div style={{
          padding: '12px', borderRadius: '10px',
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b', marginBottom: '5px' }}>⚠️ DISCLAIMER</div>
          <p style={{ fontSize: '0.72rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
            This is algorithmic analysis, not financial advice. Past patterns don't guarantee future results. Always conduct your own research and consult a SEBI-registered advisor.
          </p>
        </div>
      </div>
    </div>
  );
}

function ParamRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '1px' }}>{value}</div>
      </div>
    </div>
  );
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  padding: '3px 10px', borderRadius: '999px',
  fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.05em',
  border: '1px solid',
};

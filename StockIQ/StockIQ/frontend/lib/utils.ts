/**
 * Utility helpers shared across components.
 */

/** Format a number as Indian currency (₹) */
export function formatINR(value: number | undefined | null): string {
  if (value == null) return '—';
  if (value >= 1e12) return `₹${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9)  return `₹${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e7)  return `₹${(value / 1e7).toFixed(2)}Cr`;
  if (value >= 1e5)  return `₹${(value / 1e5).toFixed(2)}L`;
  return `₹${value.toFixed(2)}`;
}

/** Format a large number compactly */
export function formatCompact(value: number | undefined | null): string {
  if (value == null) return '—';
  if (value >= 1e9)  return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6)  return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3)  return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(2);
}

/** Format a percentage with sign */
export function formatPct(value: number | undefined | null, decimals = 2): string {
  if (value == null) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/** Format a price number */
export function formatPrice(value: number | undefined | null, decimals = 2): string {
  if (value == null) return '—';
  return value.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Get CSS class for positive/negative values */
export function colorClass(value: number | undefined | null): string {
  if (value == null) return 'neutral-color';
  return value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral-color';
}

/** Convert a regime code to readable details */
export function regimeBadgeClass(regime: string): string {
  const map: Record<string, string> = {
    TRENDING_UP: 'badge-green',
    TRENDING_DOWN: 'badge-red',
    RANGE_BOUND: 'badge-yellow',
    VOLATILE: 'badge-purple',
    BREAKOUT: 'badge-blue',
    MEAN_REVERTING: 'badge-orange',
  };
  return map[regime] || 'badge-blue';
}

/** Sentiment color class */
export function sentimentClass(sentiment: string): string {
  if (sentiment === 'POSITIVE') return 'positive';
  if (sentiment === 'NEGATIVE') return 'negative';
  return 'neutral-color';
}

/** Sentiment badge class */
export function sentimentBadgeClass(sentiment: string): string {
  if (sentiment === 'POSITIVE') return 'badge-green';
  if (sentiment === 'NEGATIVE') return 'badge-red';
  return 'badge-yellow';
}

/** Format ISO date string to "Apr 10, 2026" */
export function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

/** Format datetime to relative time ("2h ago") */
export function timeAgo(iso: string): string {
  if (!iso) return '';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return '';
  }
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Get confidence bar color */
export function confidenceColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

/** RSI signal text */
export function rsiLabel(rsi: number | null): string {
  if (rsi == null) return '—';
  if (rsi > 70) return 'Overbought';
  if (rsi < 30) return 'Oversold';
  return 'Neutral';
}

/** MACD signal text */
export function macdLabel(macd: number | null, signal: number | null): string {
  if (macd == null || signal == null) return '—';
  return macd > signal ? 'Bullish' : 'Bearish';
}

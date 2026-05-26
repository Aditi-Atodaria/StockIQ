'use client';

import { NewsData, NewsArticle } from '@/lib/api';
import { sentimentBadgeClass, timeAgo, formatDate } from '@/lib/utils';

interface NewsPanelProps {
  news: NewsData | null;
  loading: boolean;
}

const SENTIMENT_EMOJI: Record<string, string> = {
  POSITIVE: '🟢',
  NEGATIVE: '🔴',
  NEUTRAL: '🟡',
};

export default function NewsPanel({ news, loading }: NewsPanelProps) {
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: '90px', borderRadius: '12px' }} />
      ))}
    </div>
  );

  if (!news) return <div style={{ color: 'var(--text-muted)' }}>No news data available.</div>;

  const agg = news.aggregate_sentiment;
  const total = agg.positive_count + agg.negative_count + agg.neutral_count || 1;
  const aggColor = agg.label === 'POSITIVE' ? '#10b981' : agg.label === 'NEGATIVE' ? '#ef4444' : '#f59e0b';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px' }}>
      {/* Articles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <h3 style={{ fontSize: '1rem' }}>Latest News</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {news.total} articles
          </span>
        </div>

        {news.articles.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No recent news found for this stock.
          </div>
        ) : news.articles.map((article, i) => (
          <NewsCard key={i} article={article} />
        ))}
      </div>

      {/* Sidebar — Sentiment Summary */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Aggregate Sentiment */}
        <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
          <div className="section-header">Aggregate Sentiment</div>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{SENTIMENT_EMOJI[agg.label]}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: aggColor, marginBottom: '4px' }}>
            {agg.label}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>
            Score: {agg.score > 0 ? '+' : ''}{agg.score.toFixed(3)}
          </div>

          {/* Bar chart */}
          <div style={{ display: 'flex', height: '10px', borderRadius: '999px', overflow: 'hidden', gap: '2px', marginBottom: '12px' }}>
            <div style={{ width: `${(agg.positive_count / total) * 100}%`, background: '#10b981', borderRadius: '999px 0 0 999px', minWidth: agg.positive_count ? '4px' : 0 }} />
            <div style={{ width: `${(agg.neutral_count / total) * 100}%`, background: '#f59e0b' }} />
            <div style={{ width: `${(agg.negative_count / total) * 100}%`, background: '#ef4444', borderRadius: '0 999px 999px 0', minWidth: agg.negative_count ? '4px' : 0 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <SentStat label="Positive" count={agg.positive_count} color="#10b981" />
            <SentStat label="Neutral" count={agg.neutral_count} color="#f59e0b" />
            <SentStat label="Negative" count={agg.negative_count} color="#ef4444" />
          </div>
        </div>

        {/* Sentiment Distribution */}
        <div className="card">
          <div className="section-header">Sentiment Breakdown</div>
          {[
            { label: 'Positive', count: agg.positive_count, total, color: '#10b981' },
            { label: 'Neutral', count: agg.neutral_count, total, color: '#f59e0b' },
            { label: 'Negative', count: agg.negative_count, total, color: '#ef4444' },
          ].map(({ label, count, total: t, color }) => (
            <div key={label} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '0.78rem', color }}>{label}</span>
                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color }}>
                  {((count / t) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="progress-bar">
                <div style={{
                  height: '100%', borderRadius: '999px',
                  width: `${(count / t) * 100}%`,
                  background: color, transition: 'width 0.8s ease',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-accent)', fontWeight: 700, marginBottom: '4px' }}>ℹ️ Analysis Method</div>
          <p style={{ fontSize: '0.72rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
            Sentiment scored using VADER (Valence Aware Dictionary) with a finance-specific lexicon extension. Compound score range: −1 (most negative) to +1 (most positive).
          </p>
        </div>
      </div>
    </div>
  );
}

function NewsCard({ article }: { article: NewsArticle }) {
  const badgeClass = sentimentBadgeClass(article.sentiment);
  const barColor = article.sentiment === 'POSITIVE' ? '#10b981' : article.sentiment === 'NEGATIVE' ? '#ef4444' : '#f59e0b';
  const barWidth = Math.abs(article.sentiment_score) * 100;

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div className="card" style={{ cursor: 'pointer', padding: '16px', position: 'relative', overflow: 'hidden' }}>
        {/* Sentiment bar on left edge */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: barColor }} />

        <div style={{ paddingLeft: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.5, color: 'var(--text-primary)', flex: 1 }}>
              {article.title}
            </div>
            <span className={`badge ${badgeClass}`} style={{ flexShrink: 0, fontSize: '0.65rem' }}>
              {SENTIMENT_EMOJI[article.sentiment]} {article.sentiment}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{article.source}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{timeAgo(article.published_at)}</span>
            </div>
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: barColor, fontWeight: 600 }}>
              {article.sentiment_score > 0 ? '+' : ''}{article.sentiment_score.toFixed(3)}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

function SentStat({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{count}</div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

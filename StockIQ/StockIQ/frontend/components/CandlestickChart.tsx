'use client';

import { useEffect, useRef } from 'react';

interface CandlestickChartProps {
  timestamps: string[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  ema20?: number[];
  ema50?: number[];
  ema200?: number[];
}

export default function CandlestickChart({
  timestamps, open, high, low, close, volume,
  ema20, ema50, ema200
}: CandlestickChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !timestamps.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const CHART_H = H * 0.72;
    const VOL_H   = H * 0.18;
    const PAD_L   = 60, PAD_R = 20, PAD_T = 20, GAP = H * 0.06;

    const n = timestamps.length;
    const barW = Math.max(2, (W - PAD_L - PAD_R) / n);
    const candleW = Math.max(1, barW * 0.7);

    // Price range
    const visHigh = Math.max(...high);
    const visLow  = Math.min(...low);
    const priceRange = visHigh - visLow || 1;
    const toY = (p: number) => PAD_T + ((visHigh - p) / priceRange) * CHART_H;

    // Volume range
    const maxVol = Math.max(...volume) || 1;
    const volTop  = PAD_T + CHART_H + GAP;
    const volBase = volTop + VOL_H;
    const toVolH  = (v: number) => (v / maxVol) * VOL_H;

    // BG
    ctx.fillStyle = '#0f1527';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let g = 0; g <= gridLines; g++) {
      const y = PAD_T + (g / gridLines) * CHART_H;
      ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(W - PAD_R, y); ctx.stroke();
      const price = visHigh - (g / gridLines) * priceRange;
      ctx.fillStyle = 'rgba(148,163,184,0.6)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(price > 1000 ? 0 : 2), PAD_L - 6, y + 4);
    }

    // EMA lines
    const drawLine = (data: number[] | undefined, color: string) => {
      if (!data || data.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.8;
      let started = false;
      data.forEach((v, i) => {
        if (!v || isNaN(v)) return;
        const x = PAD_L + i * barW + barW / 2;
        const y = toY(v);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
    };
    drawLine(ema200, '#f59e0b');
    drawLine(ema50,  '#8b5cf6');
    drawLine(ema20,  '#06b6d4');

    // Candles + Volume
    for (let i = 0; i < n; i++) {
      const x = PAD_L + i * barW;
      const cx = x + barW / 2;
      const isGreen = close[i] >= open[i];
      const color = isGreen ? '#10b981' : '#ef4444';
      const bodyTop    = toY(Math.max(open[i], close[i]));
      const bodyBottom = toY(Math.min(open[i], close[i]));
      const bodyH = Math.max(1, bodyBottom - bodyTop);

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, toY(high[i]));
      ctx.lineTo(cx, toY(low[i]));
      ctx.stroke();

      // Body
      ctx.fillStyle = color;
      ctx.fillRect(cx - candleW / 2, bodyTop, candleW, bodyH);

      // Volume bar
      const vh = toVolH(volume[i]);
      ctx.fillStyle = isGreen ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)';
      ctx.fillRect(cx - candleW / 2, volBase - vh, candleW, vh);
    }

    // Legend
    ctx.globalAlpha = 0.9;
    const legends = [['EMA 20', '#06b6d4'], ['EMA 50', '#8b5cf6'], ['EMA 200', '#f59e0b']];
    let lx = PAD_L + 8;
    legends.forEach(([label, color]) => {
      ctx.fillStyle = color;
      ctx.fillRect(lx, PAD_T + 8, 20, 2);
      ctx.fillStyle = 'rgba(148,163,184,0.8)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(label, lx + 24, PAD_T + 14);
      lx += 80;
    });
    ctx.globalAlpha = 1;

    // X-axis labels (every n/6 bars)
    const step = Math.max(1, Math.floor(n / 6));
    for (let i = 0; i < n; i += step) {
      const x = PAD_L + i * barW + barW / 2;
      const label = timestamps[i]?.slice(0, 10) || '';
      ctx.fillStyle = 'rgba(148,163,184,0.5)';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, H - 4);
    }

  }, [timestamps, open, high, low, close, volume, ema20, ema50, ema200]);

  return (
    <div style={{ width: '100%', height: '420px', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', borderRadius: '8px' }}
      />
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';

interface RefLine { y: number; color: string; label?: string; }

interface IndicatorChartProps {
  title: string;
  data: number[];
  secondaryData?: number[];
  histData?: number[];
  timestamps: string[];
  color: string;
  secondaryColor?: string;
  referenceLines?: RefLine[];
  min?: number;
  max?: number;
}

export default function IndicatorChart({
  title, data, secondaryData, histData, timestamps,
  color, secondaryColor = '#f59e0b',
  referenceLines = [], min, max,
}: IndicatorChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data?.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const PAD_L = 55, PAD_R = 16, PAD_T = 20, PAD_B = 24;
    const chartW = W - PAD_L - PAD_R;
    const chartH = H - PAD_T - PAD_B;

    const validData = data.filter(v => v != null && !isNaN(v));
    if (!validData.length) return;

    const dataMin = min !== undefined ? min : Math.min(...validData);
    const dataMax = max !== undefined ? max : Math.max(...validData);
    const range = dataMax - dataMin || 1;

    if (secondaryData) {
      const secValid = secondaryData.filter(v => v != null && !isNaN(v));
      if (secValid.length) {
        const secMin = Math.min(...secValid);
        const secMax = Math.max(...secValid);
      }
    }

    const n = data.length;
    const step = chartW / Math.max(n - 1, 1);

    const toY  = (v: number) => PAD_T + ((dataMax - v) / range) * chartH;
    const toX  = (i: number) => PAD_L + i * step;

    // BG
    ctx.fillStyle = '#0f1527';
    ctx.fillRect(0, 0, W, H);

    // Grid + Y labels
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    for (let g = 0; g <= 4; g++) {
      const y = PAD_T + (g / 4) * chartH;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(W - PAD_R, y); ctx.stroke();
      const val = dataMax - (g / 4) * range;
      ctx.fillStyle = 'rgba(148,163,184,0.5)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(2), PAD_L - 5, y + 4);
    }

    // Reference lines
    referenceLines.forEach(({ y: refVal, color: refColor, label }) => {
      const y = toY(refVal);
      if (y < PAD_T || y > PAD_T + chartH) return;
      ctx.strokeStyle = refColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(W - PAD_R, y); ctx.stroke();
      ctx.setLineDash([]);
      if (label) {
        ctx.fillStyle = refColor;
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, PAD_L + 4, y - 3);
      }
    });

    // Histogram (MACD hist)
    if (histData?.length) {
      const allVals = histData.filter(v => v != null && !isNaN(v));
      const hMax = Math.max(...allVals.map(Math.abs)) || 1;
      const zero = toY(0);
      histData.forEach((v, i) => {
        if (v == null || isNaN(v)) return;
        const x = toX(i);
        const barH = Math.abs((v / hMax) * (chartH * 0.4));
        ctx.fillStyle = v >= 0 ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)';
        ctx.fillRect(x - step * 0.35, v >= 0 ? zero - barH : zero, step * 0.7, barH);
      });
    }

    // Area fill under main line
    const gradient = ctx.createLinearGradient(0, PAD_T, 0, PAD_T + chartH);
    gradient.addColorStop(0, `${color}33`);
    gradient.addColorStop(1, `${color}00`);
    ctx.beginPath();
    let firstValid = true;
    data.forEach((v, i) => {
      if (v == null || isNaN(v)) return;
      const x = toX(i), y = toY(v);
      if (firstValid) { ctx.moveTo(x, y); firstValid = false; }
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(toX(n - 1), PAD_T + chartH);
    ctx.lineTo(PAD_L, PAD_T + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Main line
    const drawLine = (lineData: number[], lineColor: string, width = 1.5) => {
      ctx.beginPath();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      let started = false;
      lineData.forEach((v, i) => {
        if (v == null || isNaN(v)) return;
        const x = toX(i), y = toY(v);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    drawLine(data, color, 2);
    if (secondaryData) drawLine(secondaryData, secondaryColor, 1.5);

    // X-axis labels
    const xStep = Math.max(1, Math.floor(n / 5));
    for (let i = 0; i < n; i += xStep) {
      ctx.fillStyle = 'rgba(148,163,184,0.4)';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(timestamps[i]?.slice(5, 10) || '', toX(i), H - 6);
    }

  }, [data, secondaryData, histData, timestamps, color, referenceLines, min, max]);

  return (
    <div className="card" style={{ padding: '16px' }}>
      <div className="section-header" style={{ marginBottom: '10px' }}>{title}</div>
      <div style={{ width: '100%', height: '180px' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}

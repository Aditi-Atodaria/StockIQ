import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StockIQ — AI-Powered Stock Intelligence Platform',
  description: 'Real-time stock analysis, regime detection, and AI strategy recommendations for Indian & global markets.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📈</text></svg>" />
      </head>
      <body className="animated-gradient">{children}</body>
    </html>
  );
}

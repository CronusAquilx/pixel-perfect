/**
 * Market data service layer. Provider-agnostic: swap `mockProvider` for a
 * real implementation of `MarketProvider` (stocks/crypto/news) later.
 * All data here is SIMULATED.
 */
export type Category = "stock" | "etf" | "crypto" | "meme" | "index";

export interface Asset {
  symbol: string;
  name: string;
  category: Category;
  basePrice: number;
  vol: number; // daily volatility (fraction)
  marketCap?: number;
  volume: number;
}

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  minutesAgo: number;
  symbol: string;
  summary: string;
}

export interface MarketProvider {
  listAssets(): Asset[];
  history(symbol: string, points: number, stepDays: number): number[];
  news(): NewsItem[];
}

const A = (symbol: string, name: string, category: Category, basePrice: number, vol: number, volume: number, marketCap?: number): Asset => ({ symbol, name, category, basePrice, vol, volume, marketCap });

export const ASSETS: Asset[] = [
  A("SPX", "S&P 500", "index", 5842.1, 0.009, 2.4e9),
  A("NDX", "NASDAQ 100", "index", 20514.3, 0.012, 1.9e9),
  A("DJI", "Dow Jones", "index", 42863.9, 0.008, 3.1e8),
  A("AAPL", "Apple Inc.", "stock", 228.4, 0.015, 5.2e7, 3.46e12),
  A("NVDA", "NVIDIA Corp.", "stock", 138.2, 0.03, 2.4e8, 3.39e12),
  A("TSLA", "Tesla Inc.", "stock", 248.9, 0.035, 9.1e7, 7.9e11),
  A("MSFT", "Microsoft Corp.", "stock", 418.7, 0.014, 2.1e7, 3.11e12),
  A("AMZN", "Amazon.com Inc.", "stock", 186.3, 0.018, 4.0e7, 1.95e12),
  A("META", "Meta Platforms", "stock", 582.1, 0.022, 1.4e7, 1.47e12),
  A("GOOGL", "Alphabet Inc.", "stock", 164.8, 0.017, 2.6e7, 2.03e12),
  A("AMD", "Advanced Micro Devices", "stock", 156.4, 0.03, 4.3e7, 2.53e11),
  A("NFLX", "Netflix Inc.", "stock", 721.5, 0.022, 3.2e6, 3.1e11),
  A("JPM", "JPMorgan Chase", "stock", 211.2, 0.013, 9.0e6, 6.0e11),
  A("SPY", "SPDR S&P 500 ETF", "etf", 582.3, 0.009, 4.5e7),
  A("QQQ", "Invesco QQQ Trust", "etf", 498.6, 0.012, 3.3e7),
  A("VOO", "Vanguard S&P 500 ETF", "etf", 535.7, 0.009, 5.1e6),
  A("VTI", "Vanguard Total Market", "etf", 287.4, 0.009, 3.4e6),
  A("BTC", "Bitcoin", "crypto", 64250, 0.035, 3.1e10, 1.27e12),
  A("ETH", "Ethereum", "crypto", 2480, 0.042, 1.4e10, 2.98e11),
  A("SOL", "Solana", "crypto", 146.2, 0.055, 2.3e9, 6.8e10),
  A("DOGE", "Dogecoin", "crypto", 0.1132, 0.06, 6.2e8, 1.65e10),
  A("XRP", "XRP", "crypto", 0.528, 0.045, 1.1e9, 2.98e10),
  A("PEPE", "Pepe", "meme", 0.00000921, 0.14, 7.4e8, 3.9e9),
  A("WIF", "dogwifhat", "meme", 2.14, 0.16, 4.1e8, 2.1e9),
  A("BONK", "Bonk", "meme", 0.0000213, 0.15, 2.2e8, 1.5e9),
  A("FLOKI", "Floki", "meme", 0.000136, 0.13, 1.4e8, 1.3e9),
  A("MOON", "MoonRocket (sim)", "meme", 0.0421, 0.22, 3.2e7, 4.2e7),
];

export const getAsset = (s: string) => ASSETS.find((a) => a.symbol === s.toUpperCase());

// Deterministic PRNG so history is stable per symbol/timeframe
function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 2147483647, 7) || 1;

export const mockProvider: MarketProvider = {
  listAssets: () => ASSETS,
  history(symbol, points, stepDays) {
    const a = getAsset(symbol);
    if (!a) return [];
    const rnd = seeded(hash(symbol + points + stepDays));
    const stepVol = a.vol * Math.sqrt(stepDays);
    const out: number[] = [];
    let p = a.basePrice;
    for (let i = 0; i < points; i++) {
      out.unshift(p);
      const shock = (rnd() - 0.5) * 2 * stepVol;
      p = p / (1 + shock + 0.0004 * stepDays);
    }
    return out;
  },
  news: () => NEWS,
};

export const market = mockProvider;

export const TIMEFRAMES = {
  "1D": { points: 78, step: 1 / 78 },
  "1W": { points: 70, step: 0.1 },
  "1M": { points: 30, step: 1 },
  "3M": { points: 90, step: 1 },
  "1Y": { points: 52, step: 7 },
  MAX: { points: 120, step: 30 },
} as const;
export type Timeframe = keyof typeof TIMEFRAMES;

export const NEWS: NewsItem[] = [
  { id: "n1", headline: "Chipmakers extend rally as data-center demand forecasts climb", source: "MarketLab Wire", minutesAgo: 12, symbol: "NVDA", summary: "Semiconductor shares rose for a third session as analysts raised capex estimates for cloud providers." },
  { id: "n2", headline: "Bitcoin holds key level after volatile overnight session", source: "Chain Daily (sim)", minutesAgo: 34, symbol: "BTC", summary: "Traders watched a support zone closely as funding rates normalized across major exchanges." },
  { id: "n3", headline: "Apple supplier checks point to steady handset shipments", source: "MarketLab Wire", minutesAgo: 58, symbol: "AAPL", summary: "Channel data suggests demand is in line with expectations heading into the holiday quarter." },
  { id: "n4", headline: "Meme coin volumes spike — and so do liquidations", source: "Degen Desk (sim)", minutesAgo: 75, symbol: "WIF", summary: "A 40% intraday swing wiped out leveraged positions on both sides, a reminder of extreme volatility." },
  { id: "n5", headline: "Index funds see record inflows as investors favor broad exposure", source: "Fund Flow Report", minutesAgo: 110, symbol: "VOO", summary: "Low-cost ETFs tracking the S&P 500 continued to attract long-term savers." },
  { id: "n6", headline: "Tesla delivery estimates diverge widely ahead of report", source: "Auto Ledger (sim)", minutesAgo: 140, symbol: "TSLA", summary: "Analyst forecasts span a wide range, which often precedes outsized moves on the announcement." },
  { id: "n7", headline: "Ethereum network fees fall to multi-month lows", source: "Chain Daily (sim)", minutesAgo: 190, symbol: "ETH", summary: "Lower activity on the base layer coincides with growth on scaling networks." },
  { id: "n8", headline: "Streaming subscriber growth beats estimates", source: "MarketLab Wire", minutesAgo: 260, symbol: "NFLX", summary: "Ad-supported tiers drove most new sign-ups during the quarter." },
];

export function fmtUSD(n: number, opts: { compact?: boolean; sign?: boolean } = {}) {
  const sign = opts.sign && n > 0 ? "+" : "";
  if (opts.compact) return sign + new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 }).format(n);
  const abs = Math.abs(n);
  const digits = abs === 0 ? 2 : abs < 0.001 ? 8 : abs < 1 ? 4 : 2;
  return sign + new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}
export const fmtPct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
export const fmtQty = (n: number) => (n >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : +n.toFixed(6) + "");

export function volatilityRating(a: Asset) {
  if (a.vol >= 0.15) return { label: "EXTREME", tone: "loss" as const };
  if (a.vol >= 0.05) return { label: "HIGH", tone: "warn" as const };
  if (a.vol >= 0.02) return { label: "MODERATE", tone: "warn" as const };
  return { label: "LOW", tone: "gain" as const };
}

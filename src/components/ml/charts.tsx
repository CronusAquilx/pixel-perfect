import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { market, TIMEFRAMES, fmtUSD, type Timeframe } from "@/lib/market";
import { usePrices } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Sparkline({ symbol, className }: { symbol: string; className?: string }) {
  const price = usePrices((s) => s.prices[symbol]);
  const data = useMemo(() => market.history(symbol, 40, 1 / 40).map((v, i) => ({ i, v })), [symbol]);
  const series = [...data, { i: data.length, v: price }];
  const up = price >= data[0]?.v;
  const color = up ? "var(--gain)" : "var(--loss)";
  return (
    <div className={cn("h-10 w-24", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
          <defs>
            <linearGradient id={`sp-${symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#sp-${symbol})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TimeframeTabs({ value, onChange }: { value: Timeframe; onChange: (t: Timeframe) => void }) {
  return (
    <div className="flex gap-1 rounded-md bg-muted p-1">
      {(Object.keys(TIMEFRAMES) as Timeframe[]).map((t) => (
        <button key={t} onClick={() => onChange(t)} className={cn("num rounded px-2.5 py-1 text-xs transition-colors", value === t ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground")}>
          {t}
        </button>
      ))}
    </div>
  );
}

export function PriceChart({ symbol, height = 320, showMA = false }: { symbol: string; height?: number; showMA?: boolean }) {
  const [tf, setTf] = useState<Timeframe>("1M");
  const price = usePrices((s) => s.prices[symbol]);
  const base = useMemo(() => market.history(symbol, TIMEFRAMES[tf].points, TIMEFRAMES[tf].step), [symbol, tf]);
  const series = [...base, price].map((v, i, arr) => {
    const w = arr.slice(Math.max(0, i - 9), i + 1);
    return { i, v, ma: w.reduce((a, b) => a + b, 0) / w.length };
  });
  const up = price >= base[0];
  const color = up ? "var(--gain)" : "var(--loss)";
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="label-caps">Simulated data</span>
        <TimeframeTabs value={tf} onChange={setTf} />
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`pc-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="i" hide />
            <YAxis domain={["dataMin", "dataMax"]} orientation="right" tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "JetBrains Mono" }} tickFormatter={(v) => fmtUSD(v, { compact: v > 1000 })} axisLine={false} tickLine={false} width={70} />
            <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontFamily: "JetBrains Mono", fontSize: 12 }} labelFormatter={() => symbol} formatter={(v: number, n) => [fmtUSD(v), n === "ma" ? "MA(10)" : "Price"]} />
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#pc-${symbol})`} animationDuration={500} />
            {showMA && <Area type="monotone" dataKey="ma" stroke="var(--chart-2)" strokeWidth={1.25} strokeDasharray="4 3" fill="transparent" animationDuration={500} />}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ValueChart({ data, height = 220 }: { data: { t: number; v: number }[]; height?: number }) {
  const series = data.length > 1 ? data : [...data, ...data];
  const up = (series.at(-1)?.v ?? 0) >= (series[0]?.v ?? 0);
  const color = up ? "var(--gain)" : "var(--loss)";
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="vc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="t" hide />
          <YAxis domain={["dataMin", "dataMax"]} orientation="right" tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "JetBrains Mono" }} tickFormatter={(v) => fmtUSD(v, { compact: true })} axisLine={false} tickLine={false} width={64} />
          <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontFamily: "JetBrains Mono", fontSize: 12 }} labelFormatter={(t) => new Date(t as number).toLocaleTimeString()} formatter={(v: number) => [fmtUSD(v), "Value"]} />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill="url(#vc)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

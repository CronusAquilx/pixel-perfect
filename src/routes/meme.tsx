import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Change, PageHeader, Panel, Tag } from "@/components/ml/bits";
import { Sparkline } from "@/components/ml/charts";
import { useTrade } from "@/components/ml/TradeDialog";
import { ASSETS, fmtUSD, volatilityRating } from "@/lib/market";
import { changePct, usePrices } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/meme")({
  head: () => seo("Meme Market", "Learn how extreme volatility works with simulated meme coins."),
  component: Meme,
});

function Meme() {
  const memes = ASSETS.filter((a) => a.category === "meme");
  const { prices, open } = usePrices();
  const show = useTrade((s) => s.show);
  return (
    <>
      <PageHeader title="MEME MARKET" sub="High-volatility simulated assets. Study them — don't chase them." />
      <div className="mb-6 flex gap-3 rounded-md border border-loss/40 bg-loss/10 p-4 text-sm">
        <AlertTriangle className="h-5 w-5 shrink-0 text-loss" />
        <div><div className="font-semibold tracking-wider text-loss">EXTREME VOLATILITY</div><p className="mt-1 text-muted-foreground">Meme coins often have no cash flows and thin liquidity. Prices move on hype and can fall 50–90% in days. If you experiment here, size tiny and use a stop loss.</p></div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {memes.map((a) => {
          const vr = volatilityRating(a);
          const range = a.vol * 100;
          return (
            <Panel key={a.symbol}>
              <div className="flex items-start justify-between">
                <Link to="/markets/$symbol" params={{ symbol: a.symbol }}><div className="num font-semibold">{a.symbol}</div><div className="text-xs text-muted-foreground">{a.name}</div></Link>
                <div className="flex gap-1"><Tag tone={vr.tone}>{vr.label}</Tag><Tag tone="loss">RISK 5/5</Tag></div>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div><div className="num text-xl">{fmtUSD(prices[a.symbol])}</div><Change value={changePct(a.symbol, prices, open)} className="text-xs" /></div>
                <Sparkline symbol={a.symbol} className="h-12 w-32" />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">Volume {fmtUSD(a.volume, { compact: true })} · typical daily swing ±{range.toFixed(0)}% — $1,000 could be ${(1000 * (1 - a.vol)).toFixed(0)}–${(1000 * (1 + a.vol)).toFixed(0)} tomorrow.</div>
              <Button variant="terminal" size="sm" className="mt-3 w-full" onClick={() => show(a.symbol)}>Practice trade</Button>
            </Panel>
          );
        })}
      </div>
    </>
  );
}

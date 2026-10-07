import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Change, Explain, PageHeader, Panel, Stat } from "@/components/ml/bits";
import { PriceChart } from "@/components/ml/charts";
import { TradeForm } from "@/components/ml/TradeDialog";
import { ASSETS, fmtQty, fmtUSD } from "@/lib/market";
import { usePortfolio, usePrices, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/trade")({
  head: () => seo("Trade · Day Trading Mode", "Practice entries, exits, stop-loss, take-profit and position sizing with virtual money."),
  component: TradePage,
});

const TRADABLE = ASSETS.filter((a) => a.category !== "index");

function TradePage() {
  const [symbol, setSymbol] = useState("NVDA");
  const [tab, setTab] = useState<"order" | "day">("day");
  return (
    <>
      <PageHeader title="Trade" sub="Standard orders or the Day Trading desk with risk controls." action={
        <div className="flex gap-1 rounded-md bg-muted p-1">
          {(["day", "order"] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded px-3 py-1.5 text-sm ${tab === t ? "bg-background" : "text-muted-foreground"}`}>{t === "day" ? "Day trading" : "Standard order"}</button>)}
        </div>
      } />
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {TRADABLE.map((a) => <button key={a.symbol} onClick={() => setSymbol(a.symbol)} className={`num shrink-0 rounded border px-2.5 py-1 text-xs ${symbol === a.symbol ? "bg-foreground text-background" : "text-muted-foreground"}`}>{a.symbol}</button>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2"><PriceChart symbol={symbol} height={360} showMA /></Panel>
        <Panel title={tab === "day" ? "Day trading desk" : "Order ticket"}>
          {tab === "order" ? <TradeForm key={symbol} symbol={symbol} compact /> : <DayDesk key={symbol} symbol={symbol} />}
        </Panel>
      </div>
      <OpenPositions />
    </>
  );
}

function DayDesk({ symbol }: { symbol: string }) {
  const price = usePrices((s) => s.prices[symbol]);
  const { cash, trade } = useStore();
  const [riskPct, setRiskPct] = useState(1);
  const [slPct, setSlPct] = useState(2);
  const [tpPct, setTpPct] = useState(4);
  const entry = price;
  const sl = entry * (1 - slPct / 100);
  const tp = entry * (1 + tpPct / 100);
  const riskDollars = (cash * riskPct) / 100;
  const qty = Math.min(riskDollars / (entry - sl), cash / entry);
  const loss = qty * (entry - sl);
  const gain = qty * (tp - entry);
  const rr = gain / loss;
  const num = (v: number, set: (n: number) => void, step = 0.5) => <Input type="number" step={step} min={0.1} value={v} onChange={(e) => set(Math.max(0.1, parseFloat(e.target.value) || 0.1))} className="num mt-1 h-8" />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <label><span className="label-caps">Risk %</span>{num(riskPct, setRiskPct, 0.25)}</label>
        <label><span className="label-caps">Stop %</span>{num(slPct, setSlPct)}</label>
        <label><span className="label-caps">Target %</span>{num(tpPct, setTpPct)}</label>
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-md bg-muted/50 p-3">
        <Stat label="Entry price" value={fmtUSD(entry)} />
        <Stat label="Current price" value={fmtUSD(price)} />
        <Stat label="Position size" value={fmtQty(+qty.toFixed(4))} />
        <Stat label="Risk/Reward" value={`1 : ${rr.toFixed(2)}`} />
        <Stat label="Stop loss" value={<span className="text-loss">{fmtUSD(sl)}</span>} />
        <Stat label="Take profit" value={<span className="text-gain">{fmtUSD(tp)}</span>} />
        <Stat label="Potential gain" value={<Change value={gain} pct={false} />} />
        <Stat label="Potential loss" value={<Change value={-loss} pct={false} />} />
      </div>
      <Button variant="gain" className="w-full" disabled={!(qty > 0)} onClick={() => trade(symbol, "BUY", +qty.toFixed(4), price, { stopLoss: sl, takeProfit: tp })}>Quick entry · buy {fmtQty(+qty.toFixed(4))}</Button>
      <Explain term="Stop Loss">An order designed to limit potential losses if the price moves against you. Here it auto-sells at {fmtUSD(sl)}.</Explain>
      <Explain term="Take Profit">Automatically closes the position at your target to lock in gains.</Explain>
      <Explain term="Position sizing">Quantity is computed so that hitting your stop loses only {riskPct}% of cash ({fmtUSD(riskDollars)}).</Explain>
    </div>
  );
}

function OpenPositions() {
  const { holdings } = usePortfolio();
  const { trade, orders, cancelOrder } = useStore();
  if (!holdings.length && !orders.length) return null;
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <Panel title="Open positions · quick exit">
        {holdings.map((h) => (
          <div key={h.symbol} className="flex items-center gap-3 border-b py-2.5 text-sm last:border-0">
            <span className="num w-14 font-semibold">{h.symbol}</span>
            <span className="num flex-1 text-xs text-muted-foreground">SL {h.stopLoss ? fmtUSD(h.stopLoss) : "—"} · TP {h.takeProfit ? fmtUSD(h.takeProfit) : "—"}</span>
            <Change value={h.plPct} />
            <Button size="sm" variant="loss" onClick={() => trade(h.symbol, "SELL", h.qty, h.price)}>Exit</Button>
          </div>
        ))}
        {!holdings.length && <p className="text-sm text-muted-foreground">No open positions.</p>}
      </Panel>
      <Panel title="Pending limit orders">
        {orders.map((o) => (
          <div key={o.id} className="num flex items-center gap-3 border-b py-2.5 text-sm last:border-0">
            <span className={o.side === "BUY" ? "text-gain" : "text-loss"}>{o.side}</span><span className="flex-1">{o.qty} {o.symbol} @ {fmtUSD(o.limit)}</span>
            <Button size="sm" variant="outline" onClick={() => cancelOrder(o.id)}>Cancel</Button>
          </div>
        ))}
        {!orders.length && <p className="text-sm text-muted-foreground">No pending orders.</p>}
      </Panel>
    </div>
  );
}

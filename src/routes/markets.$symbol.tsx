import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Change, Panel, Stat, Tag } from "@/components/ml/bits";
import { PriceChart } from "@/components/ml/charts";
import { useTrade } from "@/components/ml/TradeDialog";
import { fmtQty, fmtUSD, getAsset, NEWS, volatilityRating } from "@/lib/market";
import { changePct, usePrices, useStore } from "@/lib/store";

export const Route = createFileRoute("/markets/$symbol")({
  loader: ({ params }) => {
    const a = getAsset(params.symbol);
    if (!a) throw notFound();
    return { symbol: a.symbol, name: a.name };
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.symbol} · ${loaderData.name} — MARKETLAB` : "Asset not found — MARKETLAB";
    const d = loaderData ? `Simulated price, chart and virtual trading for ${loaderData.name}.` : "Unknown asset.";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }] };
  },
  notFoundComponent: () => <p className="p-10 text-center text-muted-foreground">Asset not found. <Link to="/markets" className="underline">Back to markets</Link></p>,
  component: AssetPage,
});

function AssetPage() {
  const { symbol } = Route.useLoaderData();
  const a = getAsset(symbol)!;
  const price = usePrices((s) => s.prices[symbol]);
  const ch = usePrices((s) => changePct(symbol, s.prices, s.open));
  const { watchlist, toggleWatch, positions, markViewed } = useStore();
  const show = useTrade((s) => s.show);
  const pos = positions[symbol];
  const vr = volatilityRating(a);
  useEffect(() => markViewed(symbol), [symbol, markViewed]);
  const news = NEWS.filter((n) => n.symbol === symbol);
  const watched = watchlist.includes(symbol);

  return (
    <>
      <Link to="/markets" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Markets</Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><span className="num text-sm text-muted-foreground">{symbol}</span><Tag>{a.category.toUpperCase()}</Tag><Tag tone={vr.tone}>{vr.label} VOL</Tag></div>
          <h1 className="mt-1 text-2xl font-semibold md:text-3xl">{a.name}</h1>
          <div className="mt-2 flex items-baseline gap-3"><span key={Math.round(price * 1e6)} className="num animate-flash rounded px-1 text-3xl md:text-4xl">{fmtUSD(price)}</span><Change value={ch} /></div>
        </div>
        {a.category !== "index" && (
          <div className="flex w-full gap-2 sm:w-auto">
            <Button data-tour="buy" variant="gain" className="flex-1 sm:w-28" onClick={() => show(symbol, "BUY")}>Buy</Button>
            <Button variant="loss" className="flex-1 sm:w-28" onClick={() => show(symbol, "SELL")} disabled={!pos}>Sell</Button>
            <Button variant="terminal" onClick={() => toggleWatch(symbol)}><Star className={watched ? "fill-warn text-warn" : ""} />{watched ? "Watching" : "Watchlist"}</Button>
          </div>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2"><PriceChart symbol={symbol} /></Panel>
        <div className="space-y-4">
          <Panel title="Key stats">
            <div className="grid grid-cols-2 gap-4">
              <Stat label="24h change" value={<Change value={ch} />} />
              <Stat label="Volume" value={fmtUSD(a.volume, { compact: true })} />
              <Stat label="Market cap" value={a.marketCap ? fmtUSD(a.marketCap, { compact: true }) : "—"} />
              <Stat label="Daily vol" value={`${(a.vol * 100).toFixed(1)}%`} />
            </div>
          </Panel>
          {pos && (
            <Panel title="Your position">
              <div className="grid grid-cols-2 gap-4">
                <Stat label="Quantity" value={fmtQty(pos.qty)} />
                <Stat label="Avg entry" value={fmtUSD(pos.avg)} />
                <Stat label="Value" value={fmtUSD(pos.qty * price)} />
                <Stat label="P/L" value={<Change value={(price / pos.avg - 1) * 100} />} />
              </div>
            </Panel>
          )}
          {news.length > 0 && (
            <Panel title="News">
              {news.map((n) => <div key={n.id} className="text-sm"><div className="font-medium">{n.headline}</div><p className="mt-1 text-xs text-muted-foreground">{n.summary}</p></div>)}
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

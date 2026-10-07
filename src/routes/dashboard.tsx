import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Award, BookOpen, Wallet } from "lucide-react";
import { AssetRow, Change, PageHeader, Panel, Stat } from "@/components/ml/bits";
import { Sparkline, ValueChart } from "@/components/ml/charts";
import { fmtUSD, getAsset } from "@/lib/market";
import { changePct, usePortfolio, usePrices, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { TUTORIAL } from "@/lib/content";

export const Route = createFileRoute("/dashboard")({
  head: () => seo("Dashboard", "Your virtual portfolio, market overview, watchlist and recent activity."),
  component: Dashboard,
});

const OVERVIEW = ["SPX", "NDX", "DJI", "BTC", "ETH"];
const ICON = { trade: ArrowUpRight, deposit: Wallet, challenge: Award, lesson: BookOpen, badge: Award } as const;

function Dashboard() {
  const p = usePortfolio();
  const { watchlist, activity, history, username, lessonsDone } = useStore();
  const tutDone = TUTORIAL.filter((t) => lessonsDone.includes(t.lesson)).length;
  return (
    <>
      <PageHeader title={`Welcome back, ${username}`} sub="All balances are virtual. Market data is simulated." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Portfolio" className="lg:col-span-2">
          <div className="num text-4xl font-medium tracking-tight md:text-5xl">{fmtUSD(p.total)}</div>
          <div className="mt-1 flex gap-3 text-sm"><Change value={p.totalPl} pct={false} /><Change value={p.returnPct} /> <span className="text-muted-foreground">all time</span></div>
          <div className="mt-4"><ValueChart data={history} /></div>
          <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 md:grid-cols-4">
            <Stat label="Available cash" value={fmtUSD(p.cash)} />
            <Stat label="Today's P/L" value={<Change value={p.dayPl} pct={false} />} />
            <Stat label="Total P/L" value={<Change value={p.totalPl} pct={false} />} />
            <Stat label="Buying power" value={fmtUSD(p.buyingPower)} />
          </div>
        </Panel>
        <Panel title="Recent activity">
          <div className="max-h-[420px] space-y-3 overflow-auto">
            {activity.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
            {activity.slice(0, 12).map((a) => {
              const I = a.text.startsWith("Sold") ? ArrowDownRight : ICON[a.kind];
              return (
                <div key={a.id} className="flex gap-3 text-sm">
                  <I className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div><div>{a.text}</div><div className="num text-[0.65rem] text-muted-foreground">{new Date(a.ts).toLocaleString()}</div></div>
                </div>
              );
            })}
          </div>
          <Link to="/learn" className="mt-4 block rounded-md bg-muted p-3 text-sm">
            <div className="label-caps">Tutorial progress</div>
            <div className="mt-1">{tutDone} / 10 lessons completed</div>
            <div className="mt-2 h-1 rounded bg-background"><div className="h-full rounded bg-gain" style={{ width: `${tutDone * 10}%` }} /></div>
          </Link>
        </Panel>
      </div>

      <h2 className="label-caps mb-3 mt-8">Market overview</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {OVERVIEW.map((s) => <OverviewCard key={s} symbol={s} />)}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Panel title="Watchlist" action={<Link to="/watchlist" className="text-xs text-muted-foreground hover:text-foreground">Manage</Link>}>
          {watchlist.length === 0 ? <p className="text-sm text-muted-foreground">Star assets in Markets to track them here.</p> : watchlist.map((s) => <AssetRow key={s} symbol={s} />)}
        </Panel>
        <Panel title="Holdings" action={<Link to="/portfolio" className="text-xs text-muted-foreground hover:text-foreground">Portfolio</Link>}>
          {p.holdings.length === 0 ? (
            <div className="text-sm text-muted-foreground">No positions yet. <Link to="/markets" className="text-foreground underline">Explore markets</Link></div>
          ) : (
            p.holdings.map((h) => (
              <Link key={h.symbol} to="/markets/$symbol" params={{ symbol: h.symbol }} className="flex items-center justify-between border-b py-3 text-sm last:border-0">
                <span className="num font-semibold">{h.symbol}</span>
                <span className="num text-muted-foreground">{fmtUSD(h.value)}</span>
                <Change value={h.plPct} />
              </Link>
            ))
          )}
        </Panel>
      </div>
    </>
  );
}

function OverviewCard({ symbol }: { symbol: string }) {
  const price = usePrices((s) => s.prices[symbol]);
  const ch = usePrices((s) => changePct(symbol, s.prices, s.open));
  return (
    <Link to="/markets/$symbol" params={{ symbol }} className="panel p-3 transition-colors hover:bg-accent">
      <div className="text-xs text-muted-foreground">{getAsset(symbol)!.name}</div>
      <div className="num mt-1 text-sm">{fmtUSD(price)}</div>
      <Change value={ch} className="text-xs" />
      <Sparkline symbol={symbol} className="mt-2 w-full" />
    </Link>
  );
}

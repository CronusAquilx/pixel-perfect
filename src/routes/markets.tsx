import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { AssetRow, PageHeader, Panel } from "@/components/ml/bits";
import { ASSETS, type Category } from "@/lib/market";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/markets")({
  head: () => seo("Markets", "Explore simulated stocks, ETFs, crypto and meme coins."),
  component: MarketsLayout,
});

function MarketsLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path !== "/markets" && path !== "/markets/") return <Outlet />;
  return <Markets />;
}

const CATS: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "All" }, { id: "stock", label: "Stocks" }, { id: "etf", label: "ETFs" }, { id: "crypto", label: "Crypto" }, { id: "meme", label: "Meme Coins" }, { id: "index", label: "Indices" },
];

function Markets() {
  const [cat, setCat] = useState<Category | "all">("all");
  const [q, setQ] = useState("");
  const list = ASSETS.filter((a) => (cat === "all" || a.category === cat) && (a.symbol + a.name).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="Markets" sub="Simulated prices update every 2 seconds." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {CATS.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className={cn("rounded-full border px-3 py-1 text-sm", cat === c.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>{c.label}</button>
        ))}
        <Input placeholder="Search symbol or name" value={q} onChange={(e) => setQ(e.target.value)} className="ml-auto w-full sm:w-64" />
      </div>
      {cat === "meme" && <div className="mb-4 rounded-md border border-loss/40 bg-loss/10 px-4 py-2 text-xs font-semibold tracking-wider text-loss">EXTREME VOLATILITY — meme coins can lose most of their value quickly.</div>}
      <Panel>
        {list.map((a) => <div key={a.symbol} data-tour={`asset-${a.symbol}`}><AssetRow symbol={a.symbol} /></div>)}
        {list.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No matches.</p>}
      </Panel>
    </>
  );
}

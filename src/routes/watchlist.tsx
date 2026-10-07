import { createFileRoute, Link } from "@tanstack/react-router";
import { AssetRow, PageHeader, Panel } from "@/components/ml/bits";
import { ASSETS } from "@/lib/market";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/watchlist")({
  head: () => seo("Watchlist", "Track the assets you care about."),
  component: Watchlist,
});

function Watchlist() {
  const { watchlist, toggleWatch } = useStore();
  const suggestions = ASSETS.filter((a) => !watchlist.includes(a.symbol) && a.category !== "index").slice(0, 10);
  return (
    <>
      <PageHeader title="Watchlist" sub="Tap the star to remove an asset." />
      <Panel>{watchlist.length ? watchlist.map((s) => <AssetRow key={s} symbol={s} />) : <p className="text-sm text-muted-foreground">Empty. Add from below or <Link to="/markets" className="underline">Markets</Link>.</p>}</Panel>
      <h2 className="label-caps mb-2 mt-6">Quick add</h2>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((a) => <button key={a.symbol} onClick={() => toggleWatch(a.symbol)} className="num rounded border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">+ {a.symbol}</button>)}
      </div>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Change, PageHeader, Panel, Stat } from "@/components/ml/bits";
import { TUTORIAL } from "@/lib/content";
import { fmtUSD } from "@/lib/market";
import { BADGES, levelFor, usePortfolio, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => seo("Profile", "Your level, XP, badges and trading stats."),
  component: Profile,
});

function Profile() {
  const s = useStore();
  const p = usePortfolio();
  const lvl = levelFor(s.xp);
  const sells = s.txs.filter((t) => t.type === "SELL");
  // win rate: sells above average buy price for that symbol
  const wins = sells.filter((t) => {
    const buys = s.txs.filter((b) => b.type === "BUY" && b.symbol === t.symbol && b.ts < t.ts);
    const avg = buys.reduce((a, b) => a + b.price * b.qty, 0) / (buys.reduce((a, b) => a + b.qty, 0) || 1);
    return t.price > avg;
  }).length;
  const trades = s.txs.filter((t) => t.type === "BUY" || t.type === "SELL").length;
  const tut = TUTORIAL.filter((t) => s.lessonsDone.includes(t.lesson)).length;
  return (
    <>
      <PageHeader title="Profile" />
      <Panel>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-xl font-bold text-background">{s.username.slice(0, 2).toUpperCase()}</div>
          <div className="flex-1">
            <div className="text-xl font-semibold">{s.username}</div>
            <div className="num text-sm text-muted-foreground">Level {lvl} · {s.xp} XP</div>
            <div className="mt-2 h-1.5 max-w-xs rounded bg-muted"><div className="h-full rounded bg-gain" style={{ width: `${((s.xp % 500) / 500) * 100}%` }} /></div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4 md:grid-cols-6">
          <Stat label="Portfolio" value={fmtUSD(p.total)} />
          <Stat label="Return" value={<Change value={p.returnPct} />} />
          <Stat label="Win rate" value={sells.length ? `${Math.round((wins / sells.length) * 100)}%` : "—"} />
          <Stat label="Trades" value={trades} />
          <Stat label="Badges" value={`${Object.keys(s.badges).length}/${BADGES.length}`} />
          <Stat label="Tutorial" value={`${tut}/10`} />
        </div>
      </Panel>
      <h2 className="label-caps mb-3 mt-8">Achievements</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {BADGES.map((b) => {
          const at = s.badges[b.id];
          return (
            <div key={b.id} className={cn("panel p-4", !at && "opacity-50")}>
              <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-md", at ? "bg-gain/15 text-gain" : "bg-muted")}>{at ? "★" : <Lock className="h-4 w-4" />}</div>
              <div className="text-sm font-semibold tracking-wider">{b.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{b.desc}</div>
              {at && <div className="num mt-2 text-[0.65rem] text-muted-foreground">{new Date(at).toLocaleDateString()}</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}

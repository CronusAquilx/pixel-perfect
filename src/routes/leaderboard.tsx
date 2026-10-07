import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Change, PageHeader, Panel } from "@/components/ml/bits";
import { LEADERS } from "@/lib/content";
import { usePortfolio, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => seo("Leaderboard", "Ranked by percentage return and risk-adjusted performance — not raw dollars."),
  component: Leaderboard,
});

const FRIENDS = ["mira_trades", "lowvolkid", "rangerider"];

function Leaderboard() {
  const [period, setPeriod] = useState("Weekly");
  const [scope, setScope] = useState("Global");
  const [metric, setMetric] = useState<"ret" | "sharpe" | "ch">("ret");
  const { returnPct } = usePortfolio();
  const { username, badges } = useStore();
  const mult = period === "Weekly" ? 1 : period === "Monthly" ? 1.9 : 3.4;
  let rows = LEADERS.map(([n, r, s, c]) => ({ name: n as string, ret: r * mult, sharpe: s as number, ch: c as number, you: false }));
  if (scope === "Friends") rows = rows.filter((r) => FRIENDS.includes(r.name));
  rows.push({ name: username, ret: returnPct, sharpe: +(returnPct / 4).toFixed(2), ch: Object.keys(badges).length, you: true });
  rows.sort((a, b) => b[metric] - a[metric]);
  const Seg = ({ opts, v, on }: { opts: string[]; v: string; on: (s: string) => void }) => (
    <div className="flex gap-1 rounded-md bg-muted p-1">{opts.map((o) => <button key={o} onClick={() => on(o)} className={cn("rounded px-3 py-1 text-xs", v === o ? "bg-background" : "text-muted-foreground")}>{o}</button>)}</div>
  );
  return (
    <>
      <PageHeader title="Leaderboard" sub="Everyone starts with different balances, so we rank by percentage — never raw dollars." />
      <div className="mb-4 flex flex-wrap gap-2">
        <Seg opts={["Weekly", "Monthly", "All Time"]} v={period} on={setPeriod} />
        <Seg opts={["Global", "Friends"]} v={scope} on={setScope} />
        <Seg opts={["Return %", "Risk-adjusted", "Challenges"]} v={{ ret: "Return %", sharpe: "Risk-adjusted", ch: "Challenges" }[metric]} on={(o) => setMetric(o === "Return %" ? "ret" : o === "Risk-adjusted" ? "sharpe" : "ch")} />
      </div>
      <Panel>
        {rows.map((r, i) => (
          <div key={r.name} className={cn("num flex items-center gap-4 border-b py-3 text-sm last:border-0", r.you && "-mx-2 rounded bg-gain/10 px-2")}>
            <span className={cn("w-8 text-lg", i < 3 ? "text-foreground" : "text-muted-foreground")}>#{i + 1}</span>
            <span className="flex-1 font-sans font-medium">{r.name}{r.you && " (you)"}</span>
            <span className="hidden w-24 text-right text-muted-foreground sm:block">Sharpe {r.sharpe.toFixed(2)}</span>
            <span className="hidden w-20 text-right text-muted-foreground sm:block">{r.ch} done</span>
            <Change value={r.ret} className="w-20 text-right" />
          </div>
        ))}
      </Panel>
    </>
  );
}

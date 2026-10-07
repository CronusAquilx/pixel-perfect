import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Change, PageHeader, Panel } from "@/components/ml/bits";
import { supabase } from "@/integrations/supabase/client";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => seo("Leaderboard", "Ranked by percentage return and challenges — not raw dollars."),
  component: Leaderboard,
});

type Row = { username: string; return_pct: number; trades_count: number; badges_count: number; level: number; is_me: boolean };

function Leaderboard() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [metric, setMetric] = useState<"return_pct" | "badges_count" | "trades_count">("return_pct");
  const [err, setErr] = useState("");
  useEffect(() => {
    const load = () => supabase.rpc("get_leaderboard").then(({ data, error }) => { if (error) setErr(error.message); else setRows(data as Row[]); });
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, []);
  const sorted = [...(rows ?? [])].sort((a, b) => Number(b[metric]) - Number(a[metric]));
  const OPTS = [["return_pct", "Return %"], ["badges_count", "Achievements"], ["trades_count", "Activity"]] as const;
  return (
    <>
      <PageHeader title="Leaderboard" sub="Live rankings of every MARKETLAB trader. Ranked by % so starting balance doesn't matter." />
      <div className="mb-4 flex gap-1 rounded-md bg-muted p-1 w-fit">
        {OPTS.map(([k, l]) => <button key={k} onClick={() => setMetric(k)} className={cn("rounded px-3 py-1 text-xs", metric === k ? "bg-background" : "text-muted-foreground")}>{l}</button>)}
      </div>
      <Panel>
        {err && <p className="text-sm text-loss">{err}</p>}
        {!rows && !err && <p className="text-sm text-muted-foreground">Loading…</p>}
        {rows && rows.length === 0 && <p className="text-sm text-muted-foreground">No traders yet — make a trade to appear here.</p>}
        {sorted.map((r, i) => (
          <div key={r.username + i} className={cn("num flex items-center gap-4 border-b py-3 text-sm last:border-0", r.is_me && "-mx-2 rounded bg-gain/10 px-2")}>
            <span className={cn("w-8 text-lg", i < 3 ? "text-foreground" : "text-muted-foreground")}>#{i + 1}</span>
            <span className="flex-1 font-sans font-medium">{r.username}{r.is_me && " (you)"}</span>
            <span className="hidden w-16 text-right text-muted-foreground sm:block">Lv {r.level}</span>
            <span className="hidden w-20 text-right text-muted-foreground sm:block">{r.badges_count} badges</span>
            <span className="hidden w-20 text-right text-muted-foreground sm:block">{r.trades_count} trades</span>
            <Change value={Number(r.return_pct)} className="w-20 text-right" />
          </div>
        ))}
      </Panel>
    </>
  );
}

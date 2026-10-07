import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Change, PageHeader, Panel, Stat } from "@/components/ml/bits";
import { ValueChart } from "@/components/ml/charts";
import { useTrade } from "@/components/ml/TradeDialog";
import { fmtQty, fmtUSD } from "@/lib/market";
import { usePortfolio, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/portfolio")({
  head: () => seo("Portfolio", "Holdings, allocation, performance and full virtual transaction history."),
  component: Portfolio,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];

function Portfolio() {
  const p = usePortfolio();
  const { txs, history } = useStore();
  const show = useTrade((s) => s.show);
  const [type, setType] = useState("ALL");
  const [asset, setAsset] = useState("");
  const [date, setDate] = useState("");
  const alloc = [...p.holdings.map((h) => ({ name: h.symbol, value: h.value })), { name: "CASH", value: p.cash }].filter((x) => x.value > 0);
  const filtered = txs.filter((t) => (type === "ALL" || t.type === type) && t.symbol.includes(asset.toUpperCase()) && (!date || new Date(t.ts).toISOString().slice(0, 10) === date));

  return (
    <>
      <PageHeader title="Portfolio" sub="Your simulated positions." />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Panel><Stat label="Total value" value={fmtUSD(p.total)} /></Panel>
        <Panel><Stat label="Invested" value={fmtUSD(p.invested)} /></Panel>
        <Panel><Stat label="Total P/L" value={<Change value={p.totalPl} pct={false} />} /></Panel>
        <Panel><Stat label="Return" value={<Change value={p.returnPct} />} /></Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Performance" className="lg:col-span-2"><ValueChart data={history} height={260} /></Panel>
        <Panel title="Allocation">
          <div className="h-48">
            <ResponsiveContainer><PieChart>
              <Pie data={alloc} dataKey="value" innerRadius={50} outerRadius={80} stroke="var(--card)" paddingAngle={2}>
                {alloc.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmtUSD(v)} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6 }} />
            </PieChart></ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1 text-xs">
            {alloc.map((a, i) => <div key={a.name} className="num flex justify-between"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{a.name}</span><span>{((a.value / p.total) * 100).toFixed(1)}%</span></div>)}
          </div>
        </Panel>
      </div>

      <Panel title="Holdings" className="mt-4">
        {p.holdings.length === 0 ? <p className="text-sm text-muted-foreground">No positions. <Link to="/markets" className="underline">Find something to study</Link>.</p> : (
          <div className="overflow-x-auto">
            <table className="num w-full min-w-[720px] text-sm">
              <thead><tr className="label-caps text-left">{["Asset", "Qty", "Avg entry", "Price", "Value", "Unrealized P/L", "Return", ""].map((h) => <th key={h} className="pb-2 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {p.holdings.map((h) => (
                  <tr key={h.symbol} className="border-t">
                    <td className="py-2.5"><Link to="/markets/$symbol" params={{ symbol: h.symbol }} className="font-semibold">{h.symbol}</Link></td>
                    <td>{fmtQty(h.qty)}</td><td>{fmtUSD(h.avg)}</td><td>{fmtUSD(h.price)}</td><td>{fmtUSD(h.value)}</td>
                    <td><Change value={h.pl} pct={false} /></td><td><Change value={h.plPct} /></td>
                    <td className="text-right"><Button size="sm" variant="outline" onClick={() => show(h.symbol, "SELL")}>Sell</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Transaction history" className="mt-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {["ALL", "BUY", "SELL", "DEPOSIT"].map((t) => <button key={t} onClick={() => setType(t)} className={`num rounded border px-2.5 py-1 text-xs ${type === t ? "bg-foreground text-background" : "text-muted-foreground"}`}>{t}</button>)}
          <Input placeholder="Asset" value={asset} onChange={(e) => setAsset(e.target.value)} className="h-8 w-28" />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 w-40" />
        </div>
        <div className="max-h-96 overflow-auto">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground">No transactions match.</p>}
          {filtered.map((t) => (
            <div key={t.id} className="num flex items-center gap-3 border-b py-2 text-xs last:border-0">
              <span className={`w-16 ${t.type === "BUY" ? "text-gain" : t.type === "SELL" ? "text-loss" : "text-warn"}`}>{t.type}</span>
              <span className="w-14 font-semibold">{t.symbol}</span>
              <span className="flex-1">{t.type === "DEPOSIT" ? fmtUSD(t.qty) : `${fmtQty(t.qty)} @ ${fmtUSD(t.price)}`}</span>
              <span className="text-muted-foreground">{new Date(t.ts).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

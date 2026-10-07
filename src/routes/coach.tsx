import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ml/bits";
import { usePortfolio, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { fmtUSD } from "@/lib/market";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/coach")({
  head: () => seo("AI Trading Coach", "Ask questions about charts, risk and strategy. Educational only — not financial advice."),
  component: Coach,
});

const SUGGEST = ["What does this chart mean?", "What is a stop loss?", "Why did this asset move?", "What is dollar-cost averaging?", "What does volume mean?", "Can you explain this trade?", "Should I buy BTC?"];
type Msg = { role: "user" | "assistant"; content: string };

function Coach() {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: "Hi — I'm your trading coach. I explain concepts and risks so you can make your own decisions. What do you want to learn?" }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const txs = useStore((s) => s.txs);
  const p = usePortfolio();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  const context = () => {
    const recent = txs.filter((t) => t.type === "BUY" || t.type === "SELL").slice(0, 5).map((t) => `${t.type} ${t.qty} ${t.symbol} @ ${fmtUSD(t.price)}`).join("; ");
    const holds = p.holdings.map((h) => `${h.symbol} qty ${h.qty} avg ${fmtUSD(h.avg)} now ${fmtUSD(h.price)}`).join("; ");
    return `Cash ${fmtUSD(p.cash)}, total ${fmtUSD(p.total)}, return ${p.returnPct.toFixed(2)}%. Holdings: ${holds || "none"}. Recent trades: ${recent || "none"}.`;
  };

  const send = async (q: string) => {
    if (!q.trim() || busy) return;
    const history: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    const ctrl = new AbortController();
    abort.current = ctrl;
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/coach", {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body: JSON.stringify({ messages: history.slice(1), context: context() }),
      });
      if (!res.ok || !res.body) throw new Error(res.status === 402 ? "AI credits are used up for now." : res.status === 429 ? "Too many requests — try again in a moment." : `Coach unavailable (${res.status}).`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: text }]);
      }
      if (!text) setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: "The coach couldn't answer that one." }]);
    } catch (e) {
      const msg = (e as Error).name === "AbortError" ? "(stopped)" : (e as Error).message;
      setMsgs((m) => { const last = m.at(-1)!; return [...m.slice(0, -1), { role: "assistant", content: last.content ? `${last.content}\n\n${msg}` : msg }]; });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="AI Trading Coach" sub="Teaches, never tells you what to buy." />
      <div className="mb-4 rounded-md border border-warn/40 bg-warn/10 px-4 py-2 text-center text-[0.7rem] font-semibold tracking-wider text-warn">MARKETLAB IS AN EDUCATIONAL SIMULATOR. AI RESPONSES ARE NOT FINANCIAL ADVICE.</div>
      <Panel>
        <div className="h-[50vh] space-y-3 overflow-auto pr-1">
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-sm ${m.role === "user" ? "bg-foreground text-background" : "bg-muted"}`}
                dangerouslySetInnerHTML={{ __html: (m.content || "Thinking…").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>") }} />
            </div>
          ))}
          <div ref={end} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">{SUGGEST.map((q) => <button key={q} disabled={busy} onClick={() => send(q)} className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">{q}</button>)}</div>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about a concept, chart or trade…" />
          {busy ? <Button type="button" variant="outline" aria-label="Stop" onClick={() => abort.current?.abort()}><Square /></Button> : <Button type="submit" variant="gain" aria-label="Send"><Send /></Button>}
        </form>
      </Panel>
    </div>
  );
}

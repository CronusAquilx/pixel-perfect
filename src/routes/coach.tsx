import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ml/bits";
import { usePortfolio, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { ASSETS, fmtUSD } from "@/lib/market";

export const Route = createFileRoute("/coach")({
  head: () => seo("AI Trading Coach", "Ask questions about charts, risk and strategy. Educational only — not financial advice."),
  component: Coach,
});

const KB: [RegExp, string][] = [
  [/stop.?loss/i, "A **stop loss** is an order that sells automatically if price falls to a level you choose. It caps how much one idea can cost you. Traders usually place it where their thesis is proven wrong — below support, for example — not at an arbitrary number. Try it on the Trade page's Day Trading desk."],
  [/dollar.?cost|dca/i, "**Dollar-cost averaging** means investing a fixed amount on a schedule (e.g. $200 every month) regardless of price. You buy more units when prices are low and fewer when high, and it removes the stress of timing. Trade-off: in a steadily rising market, a lump sum often does slightly better."],
  [/volume/i, "**Volume** is how much of an asset traded in a period. Price moves on high volume suggest broad participation; moves on thin volume can reverse easily. Low volume also means wider spreads — common in meme coins."],
  [/chart|candle|trend/i, "Reading a chart: 1) Zoom out (1Y/MAX) to find the trend. 2) Mark zones where price repeatedly bounced (support) or stalled (resistance). 3) Check whether price is above or below its moving average. 4) Look at volume on big moves. Charts show probabilities, never certainties."],
  [/why.*(move|drop|fall|rise|up|down)/i, "Assets move when new information changes expectations: earnings, guidance, interest-rate news, sector rotation, or simply sentiment. In MARKETLAB prices are simulated, so moves here are random walks scaled by each asset's volatility — a good way to feel how volatility works without a narrative."],
  [/should i (buy|sell)|buy this|good (buy|investment)/i, "I won't tell you to buy or sell — but here's how to think about it:\n\n• **What's your thesis?** Why would this be worth more later?\n• **Time horizon:** days, months or years?\n• **Risk:** how volatile is it, and how much of your portfolio would it be?\n• **Where are you wrong?** Define a stop before entering.\n• **Scenarios:** bull, base and bear cases — can you live with the bear case?\n\nDifferent traders reach different conclusions because they have different horizons, risk tolerance and information."],
  [/explain.*trade|my trade|last trade/i, ""],
  [/diversif/i, "**Diversification** spreads money across assets that don't all move together. It reduces the damage from any single bad outcome. Broad ETFs like VOO give you hundreds of companies in one trade."],
  [/risk.?reward|r.?r/i, "**Risk/reward** compares how much you could lose (entry to stop) with how much you could gain (entry to target). A 1:2 setup risks $1 to make $2 — you can be right less than half the time and still come out ahead."],
  [/meme|volatil/i, "Meme coins are extremely volatile: daily swings of 15–25% are common, and many lose 90%+ eventually. If you study them, size tiny and use stops. Volatility cuts both ways."],
];

function answer(q: string, ctx: { last?: string }) {
  if (/explain.*trade|my trade|last trade/i.test(q)) return ctx.last ?? "You haven't made a trade yet. Try one in Markets, then ask me again.";
  const sym = ASSETS.find((a) => new RegExp(`\\b${a.symbol}\\b`, "i").test(q));
  for (const [re, a] of KB) if (re.test(q) && a) return a + (sym ? `\n\n(${sym.symbol} has a simulated daily volatility of about ${(sym.vol * 100).toFixed(1)}%.)` : "");
  if (sym) return `${sym.name} (${sym.symbol}) is a ${sym.category}. Things to consider: its typical daily swing (~${(sym.vol * 100).toFixed(1)}%), how it fits your current allocation, and what would make you exit. Ask me about stop losses or position sizing to plan a trade.`;
  return "Good question. I can explain charts, stop losses, volume, position sizing, risk/reward, dollar-cost averaging, diversification, volatility, or walk through your last trade. Try one of the suggestions below.";
}

const SUGGEST = ["What does this chart mean?", "What is a stop loss?", "Why did this asset move?", "What is dollar-cost averaging?", "What does volume mean?", "Can you explain this trade?", "Should I buy BTC?"];

function Coach() {
  const [msgs, setMsgs] = useState<{ role: "user" | "coach"; text: string }[]>([{ role: "coach", text: "Hi — I'm your trading coach. I explain concepts and risks so you can make your own decisions. What do you want to learn?" }]);
  const [input, setInput] = useState("");
  const txs = useStore((s) => s.txs);
  const { cash } = usePortfolio();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);
  const t = txs.find((x) => x.type === "BUY" || x.type === "SELL");
  const last = t ? `Your last trade: you **${t.type === "BUY" ? "bought" : "sold"} ${t.qty} ${t.symbol}** at ${fmtUSD(t.price)} (total ${fmtUSD(t.qty * t.price)}). That was ${((t.qty * t.price) / (cash + t.qty * t.price) * 100).toFixed(1)}% of your cash at the time. Questions to reflect on: did you have an exit plan? Was a stop set? Would the same size feel comfortable if it dropped 20%?` : undefined;
  const send = (q: string) => {
    if (!q.trim()) return;
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "coach", text: answer(q, { last }) }]);
    setInput("");
  };
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="AI Trading Coach" sub="Teaches, never tells you what to buy." />
      <div className="mb-4 rounded-md border border-warn/40 bg-warn/10 px-4 py-2 text-center text-[0.7rem] font-semibold tracking-wider text-warn">MARKETLAB IS AN EDUCATIONAL SIMULATOR. AI RESPONSES ARE NOT FINANCIAL ADVICE.</div>
      <Panel>
        <div className="h-[50vh] space-y-3 overflow-auto pr-1">
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-sm animate-rise ${m.role === "user" ? "bg-foreground text-background" : "bg-muted"}`}
                dangerouslySetInnerHTML={{ __html: m.text.replace(/</g, "&lt;").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>") }} />
            </div>
          ))}
          <div ref={end} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">{SUGGEST.map((q) => <button key={q} onClick={() => send(q)} className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground">{q}</button>)}</div>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about a concept, chart or trade…" />
          <Button type="submit" variant="gain" aria-label="Send"><Send /></Button>
        </form>
      </Panel>
    </div>
  );
}

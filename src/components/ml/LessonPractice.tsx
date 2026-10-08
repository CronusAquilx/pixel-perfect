import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const checks: Record<string, { question: string; options: string[]; answer: number; why: string }> = {
  stocks: { question: "If you buy a company’s stock, what do you own?", options: ["A small part of that company", "A guaranteed paycheck"], answer: 0, why: "A share is ownership. Its value can rise or fall, and dividends are not guaranteed." },
  orders: { question: "Price is $100.40. Does a $99 limit buy fill right now?", options: ["Yes, immediately", "No, it waits for $99 or less"], answer: 1, why: "A buy limit sets the most you will pay. The order may never fill." },
  technical: { question: "A price crosses above its moving average. What does that tell you?", options: ["A possible trend change worth checking", "The next move must be up"], answer: 0, why: "A moving average summarizes past prices. It can lag and give false signals." },
  support: { question: "Buyers appeared near $95 twice. Is $95 a guaranteed floor?", options: ["Yes", "No, support can break"], answer: 1, why: "Support is a historical buying zone, not a promise. Decide where your idea is wrong." },
  construction: { question: "Is owning 20 companies in the same industry always well diversified?", options: ["Yes, 20 is enough", "No, they can fall together"], answer: 1, why: "Different industries and asset types matter, not just the number of holdings." },
  psychology: { question: "An asset just jumped 20%. What is the more thoughtful response?", options: ["Buy quickly so you don’t miss out", "Pause and check your plan and risk"], answer: 1, why: "Fear of missing out can rush decisions. A written plan helps you avoid emotional trades." },
  strategies: { question: "What does dollar-cost averaging mean?", options: ["Investing the same amount on a schedule", "Buying only when you know the bottom"], answer: 0, why: "A fixed schedule reduces timing decisions. It does not remove the risk of losing money." },
  "advanced-charts": { question: "Your trend, volume, and support clues agree. What still belongs in your plan?", options: ["Where the idea is wrong and how much you could lose", "Nothing, agreement guarantees success"], answer: 0, why: "Several clues can improve a thesis, but none guarantees the result. Define your exit and risk." },
};

export function LessonPractice({ id }: { id: string }) {
  const [picked, setPicked] = useState<number>();
  const [stop, setStop] = useState(95);
  const [target, setTarget] = useState(110);
  const [close, setClose] = useState(108);
  if (id === "rr") return <div className="mt-5 space-y-4 border-t pt-4 text-sm">
    <h3 className="font-medium">Plan the exit</h3>
    <p>Entry $100 · Risk ${100 - stop} · Potential reward ${target - 100} · Risk/reward <strong className="text-gain">1:{((target - 100) / (100 - stop)).toFixed(1)}</strong></p>
    <label className="block">Stop price: ${stop}<Slider className="mt-2" min={80} max={99} value={[stop]} onValueChange={(v) => setStop(v[0])} /></label>
    <label className="block">Target price: ${target}<Slider className="mt-2" min={101} max={130} value={[target]} onValueChange={(v) => setTarget(v[0])} /></label>
    <p className="text-xs text-muted-foreground">A target is not a promise. Stop orders may fill at a worse price in fast markets.</p>
  </div>;
  if (id === "candles") return <div className="space-y-4 text-sm">
    <h3 className="font-medium">One candle, four prices</h3>
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 150" className="h-40 w-24 shrink-0" role="img" aria-label={`Candle: open 100, high 115, low 90, close ${close}`}>
        <line x1="50" x2="50" y1="15" y2="140" stroke="currentColor" strokeWidth="3" />
        <rect x="25" y={15 + (115 - Math.max(100, close)) * 5} width="50" height={Math.max(2, Math.abs(close - 100) * 5)} fill={close >= 100 ? "var(--gain)" : "var(--loss)"} />
      </svg>
      <dl className="grid grid-cols-2 gap-x-5 gap-y-2"><dt>Open</dt><dd>$100</dd><dt>High</dt><dd>$115</dd><dt>Low</dt><dd>$90</dd><dt>Close</dt><dd className={close >= 100 ? "text-gain" : "text-loss"}>${close}</dd></dl>
    </div>
    <label className="block">Closing price<Slider className="mt-2" min={90} max={115} value={[close]} onValueChange={(v) => setClose(v[0])} /></label>
    <p>{close === 100 ? "Open equals close: a very small body." : close > 100 ? "Green: the close is above the open." : "Red: the close is below the open."} The thin wick shows the full high-to-low range.</p>
  </div>;
  const check = checks[id];
  if (!check) return null;
  return <div className="mt-5 space-y-3 border-t pt-4 text-sm"><p className="font-medium">{check.question}</p><div className="grid gap-2">{check.options.map((option, i) => <Button key={option} variant="outline" aria-pressed={picked === i} onClick={() => setPicked(i)} className="h-auto justify-start whitespace-normal py-2 text-left">{option}</Button>)}</div>{picked !== undefined && <p role="status" className={picked === check.answer ? "text-gain" : "text-warn"}>{picked === check.answer ? "Exactly. " : "Not quite. "}{check.why}</p>}</div>;
}
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useTrade } from "./TradeDialog";

const STEPS = [
  null,
  { title: "Let's make your first virtual trade", body: "Start by opening the Markets tab. That's where every asset lives.", target: "nav-markets" },
  { title: "Pick an asset", body: "Open Apple (AAPL). Each asset page shows price, volume and a chart.", target: "asset-AAPL" },
  { title: "Press BUY", body: "This opens the trading panel. Nothing here uses real money.", target: "buy" },
  { title: "Size your order", body: "Enter a quantity (try 5 shares), preview the order, then confirm the virtual trade.", target: "preview" },
  { title: "Nice. You just completed your first simulated trade.", body: "Your cash, positions and P/L updated instantly. Next, keep learning in the Learn tab — each lesson earns XP.", target: "nav-learn" },
];

export function TourCoach() {
  const step = useStore((s) => s.tutorialStep);
  const set = useStore((s) => s.set);
  const txCount = useStore((s) => s.txs.filter((t) => t.type === "BUY").length);
  const startTx = useRef(txCount);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const tradeOpen = useTrade((s) => s.open);

  useEffect(() => {
    if (step === 1 && path.startsWith("/markets")) set({ tutorialStep: path === "/markets/AAPL" ? 3 : 2 });
    if (step === 2 && path === "/markets/AAPL") set({ tutorialStep: 3 });
    if (step === 3 && tradeOpen) set({ tutorialStep: 4 });
    if (step === 4 && txCount > startTx.current) set({ tutorialStep: 5 });
    if (step === 4 && !tradeOpen && txCount === startTx.current) set({ tutorialStep: 3 });
  }, [step, path, tradeOpen, txCount, set]);

  useEffect(() => {
    if (step === 3) startTx.current = txCount;
  }, [step]); // eslint-disable-line

  useEffect(() => {
    const s = STEPS[step];
    if (!s) return;
    const apply = () => {
      document.querySelectorAll(".tour-ring").forEach((el) => el.classList.remove("tour-ring"));
      document.querySelectorAll(`[data-tour="${s.target}"]`).forEach((el) => el.classList.add("tour-ring"));
    };
    apply();
    const id = setInterval(apply, 400);
    return () => {
      clearInterval(id);
      document.querySelectorAll(".tour-ring").forEach((el) => el.classList.remove("tour-ring"));
    };
  }, [step]);

  const s = STEPS[step];
  if (!s) return null;
  return (
    <div className="glass fixed bottom-24 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-lg border p-4 shadow-2xl animate-rise lg:bottom-6">
      <div className="flex items-start justify-between gap-2">
        <span className="label-caps">Tutorial · step {step} / 5</span>
        <button aria-label="Exit tutorial" onClick={() => set({ tutorialStep: 0 })} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <div className="mt-2 font-semibold">{s.title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
      <div className="mt-3 h-1 overflow-hidden rounded bg-muted"><div className="h-full bg-gain transition-all" style={{ width: `${(step / 5) * 100}%` }} /></div>
      {step === 5 && (
        <Button asChild variant="gain" size="sm" className="mt-3 w-full" onClick={() => set({ tutorialStep: 0 })}>
          <Link to="/learn">Continue to lessons</Link>
        </Button>
      )}
    </div>
  );
}

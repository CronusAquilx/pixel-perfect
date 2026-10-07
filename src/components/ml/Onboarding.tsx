import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Sparkline } from "./charts";

const BAL = [10000, 50000, 100000];

export function Onboarding() {
  const [bal, setBal] = useState(100000);
  const start = useStore((s) => s.start);
  const navigate = useNavigate();
  const go = (tutorial: boolean) => {
    start(bal, tutorial);
    navigate({ to: "/dashboard" });
  };
  return (
    <div className="grid-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/70 to-background" />
      <div className="relative w-full max-w-xl animate-rise">
        <div className="mb-8 flex items-center gap-3 opacity-70">
          {["SPX", "BTC", "NVDA", "ETH"].map((s) => (
            <div key={s} className="panel flex flex-1 items-center gap-2 px-2 py-1.5">
              <span className="num text-[0.6rem] text-muted-foreground">{s}</span>
              <Sparkline symbol={s} className="h-6 w-full" />
            </div>
          ))}
        </div>
        <p className="label-caps mb-3">Virtual trading simulator</p>
        <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">WELCOME TO<br />MARKETLAB</h1>
        <p className="mt-4 text-lg text-muted-foreground">Learn the market. Practice your strategy. Risk nothing.</p>

        <div className="mt-10">
          <div className="label-caps mb-2">Starting virtual balance</div>
          <div className="grid grid-cols-3 gap-2">
            {BAL.map((b) => (
              <button key={b} onClick={() => setBal(b)} className={cn("num panel py-3 text-sm transition-colors", bal === b ? "!border-gain text-foreground" : "text-muted-foreground hover:text-foreground")}>
                ${b.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Button variant="gain" size="lg" onClick={() => go(true)}>Walk me through it</Button>
          <Button variant="terminal" size="lg" onClick={() => go(false)}>Skip tutorial</Button>
        </div>
        <div className="mt-8 rounded-md border border-warn/40 bg-warn/10 px-4 py-3 text-center text-xs font-semibold tracking-[0.14em] text-warn">
          VIRTUAL MONEY — NO REAL MONEY INVOLVED
        </div>
      </div>
    </div>
  );
}

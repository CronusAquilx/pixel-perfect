import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { ReactNode } from "react";
import { fmtPct, fmtUSD, getAsset } from "@/lib/market";
import { changePct, usePrices, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Sparkline } from "./charts";

export function Change({ value, className, pct = true }: { value: number; className?: string; pct?: boolean }) {
  return <span className={cn("num", value > 0 ? "text-gain" : value < 0 ? "text-loss" : "text-muted-foreground", className)}>{pct ? fmtPct(value) : fmtUSD(value, { sign: true })}</span>;
}

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("panel p-4 md:p-5 animate-rise", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="label-caps">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, sub, className }: { label: string; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="label-caps">{label}</div>
      <div className="num mt-1 text-lg font-medium md:text-xl">{value}</div>
      {sub && <div className="mt-0.5 text-xs">{sub}</div>}
    </div>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function AssetRow({ symbol, showStar = true }: { symbol: string; showStar?: boolean }) {
  const a = getAsset(symbol)!;
  const price = usePrices((s) => s.prices[symbol]);
  const ch = usePrices((s) => changePct(symbol, s.prices, s.open));
  const watched = useStore((s) => s.watchlist.includes(symbol));
  const toggle = useStore((s) => s.toggleWatch);
  return (
    <div className="group flex items-center gap-3 border-b py-3 last:border-0">
      {showStar && (
        <button aria-label={watched ? "Remove from watchlist" : "Add to watchlist"} onClick={() => toggle(symbol)} className="text-muted-foreground hover:text-foreground">
          <Star className={cn("h-4 w-4", watched && "fill-warn text-warn")} />
        </button>
      )}
      <Link to="/markets/$symbol" params={{ symbol }} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="num flex h-9 w-12 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold">{symbol}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{a.name}</div>
          <div className="label-caps !text-[0.6rem]">{a.category}</div>
        </div>
        <Sparkline symbol={symbol} className="hidden sm:block" />
        <div className="w-28 text-right">
          <div className="num text-sm">{fmtUSD(price)}</div>
          <Change value={ch} className="text-xs" />
        </div>
      </Link>
    </div>
  );
}

export function Tag({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "gain" | "loss" | "warn" }) {
  const tones = {
    muted: "bg-muted text-muted-foreground",
    gain: "bg-gain/15 text-gain",
    loss: "bg-loss/15 text-loss",
    warn: "bg-warn/15 text-warn",
  };
  return <span className={cn("num inline-flex items-center rounded px-1.5 py-0.5 text-[0.65rem] font-semibold tracking-wider", tones[tone])}>{children}</span>;
}

export function Explain({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed p-3 text-xs leading-relaxed text-muted-foreground">
      <span className="font-semibold text-foreground">{term}: </span>
      {children}
    </div>
  );
}

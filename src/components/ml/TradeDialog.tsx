import { useEffect, useState } from "react";
import { create } from "zustand";
import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fmtQty, fmtUSD, getAsset } from "@/lib/market";
import { feeFor, usePrices, useStore, type Side } from "@/lib/store";
import { cn } from "@/lib/utils";

export const useTrade = create<{ open: boolean; symbol: string; side: Side; show: (symbol: string, side?: Side) => void; close: () => void }>((set) => ({
  open: false,
  symbol: "AAPL",
  side: "BUY",
  show: (symbol, side = "BUY") => set({ open: true, symbol, side }),
  close: () => set({ open: false }),
}));

export function TradeDialog() {
  const { open, symbol, side: initialSide, close } = useTrade();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md">
        {open && <TradeForm key={symbol + initialSide} symbol={symbol} initialSide={initialSide} onDone={close} />}
      </DialogContent>
    </Dialog>
  );
}

export function TradeForm({ symbol, initialSide = "BUY", onDone, compact }: { symbol: string; initialSide?: Side; onDone?: () => void; compact?: boolean }) {
  const a = getAsset(symbol)!;
  const price = usePrices((s) => s.prices[symbol]);
  const { cash, positions, trade, placeLimit, mode } = useStore();
  const [side, setSide] = useState<Side>(initialSide);
  const [type, setType] = useState<"market" | "limit">("market");
  const [qty, setQty] = useState("");
  const [limit, setLimit] = useState("");
  const [preview, setPreview] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => setLimit(price.toPrecision(6)), [type]); // eslint-disable-line

  const q = parseFloat(qty) || 0;
  const px = type === "limit" ? parseFloat(limit) || 0 : price;
  const notional = q * px;
  const fee = feeFor(symbol, notional);
  const held = positions[symbol]?.qty ?? 0;
  const remaining = side === "BUY" ? cash - notional - fee : cash + notional - fee;
  const invalid = q <= 0 || (side === "BUY" ? mode !== "practice" && remaining < 0 : q > held + 1e-12);
  const reason = q <= 0 ? "" : side === "BUY" && remaining < 0 && mode !== "practice" ? "Exceeds available virtual cash" : side === "SELL" && q > held ? `You hold ${fmtQty(held)} ${symbol}` : "";

  const confirm = () => {
    if (type === "limit") {
      placeLimit(symbol, side, q, px);
      onDone?.();
      return;
    }
    if (trade(symbol, side, q, price)) {
      setDone(true);
      setTimeout(() => onDone?.(), 1100);
    }
  };

  if (done)
    return (
      <div className="flex flex-col items-center gap-3 py-10 animate-rise">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gain/15 text-gain"><Check className="h-7 w-7" /></div>
        <div className="text-lg font-semibold">Virtual trade complete</div>
        <div className="text-sm text-muted-foreground">Portfolio updated · +10 XP</div>
      </div>
    );

  if (preview)
    return (
      <div className="animate-rise">
        {!compact && (
          <DialogHeader>
            <DialogTitle>Order preview</DialogTitle>
            <DialogDescription>Review your simulated order before confirming.</DialogDescription>
          </DialogHeader>
        )}
        <dl className="num my-5 space-y-2.5 text-sm">
          {[
            ["Asset", symbol],
            ["Side", side],
            ["Type", type.toUpperCase()],
            [a.category === "stock" || a.category === "etf" ? "Shares" : "Quantity", fmtQty(q)],
            ["Estimated price", fmtUSD(px)],
            ["Estimated fees", fmtUSD(fee)],
            [side === "BUY" ? "Estimated cost" : "Estimated proceeds", fmtUSD(notional + (side === "BUY" ? fee : -fee))],
            ["Virtual cash remaining", fmtUSD(remaining)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b pb-2"><dt className="text-muted-foreground">{k}</dt><dd className={cn(k === "Side" && (side === "BUY" ? "text-gain" : "text-loss"))}>{v}</dd></div>
          ))}
        </dl>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setPreview(false)}>Edit</Button>
          <Button data-tour="confirm" variant={side === "BUY" ? "gain" : "loss"} className="flex-[2]" onClick={confirm}>Confirm virtual trade</Button>
        </div>
      </div>
    );

  return (
    <div>
      {!compact && (
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><span className="num">{symbol}</span><span className="text-sm font-normal text-muted-foreground">{a.name}</span></DialogTitle>
          <DialogDescription className="num">{fmtUSD(price)} · simulated</DialogDescription>
        </DialogHeader>
      )}
      <div className="mt-4 grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
        {(["BUY", "SELL"] as Side[]).map((s) => (
          <button key={s} onClick={() => setSide(s)} className={cn("rounded py-2 text-sm font-semibold transition-colors", side === s ? (s === "BUY" ? "bg-gain text-primary-foreground" : "bg-loss text-destructive-foreground") : "text-muted-foreground")}>{s}</button>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-sm">
        {(["market", "limit"] as const).map((t) => (
          <button key={t} onClick={() => setType(t)} className={cn("border-b-2 pb-1 capitalize", type === t ? "border-foreground" : "border-transparent text-muted-foreground")}>{t} order</button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="label-caps">Quantity</span>
          <Input inputMode="decimal" className="num mt-1" placeholder="0" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9.]/g, ""))} />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[0.1, 0.25, 0.5, 1].map((f) => (
            <button key={f} onClick={() => { const n = side === "BUY" ? (cash * f) / (px || price) / (1 + feeFor(symbol, 1)) : held * f; setQty(String(+n.toFixed(a.basePrice < 1 ? 0 : 4))); }} className="num rounded border px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
              {f * 100}%
            </button>
          ))}
        </div>
        {type === "limit" && (
          <label className="block">
            <span className="label-caps">Limit price</span>
            <Input inputMode="decimal" className="num mt-1" value={limit} onChange={(e) => setLimit(e.target.value.replace(/[^0-9.]/g, ""))} />
            <span className="mt-1 block text-xs text-muted-foreground">{side === "BUY" ? "Fills when price falls to or below this level." : "Fills when price rises to or above this level."}</span>
          </label>
        )}
        <dl className="num space-y-1.5 rounded-md bg-muted/50 p-3 text-xs">
          <div className="flex justify-between"><dt className="text-muted-foreground">Estimated total</dt><dd>{fmtUSD(notional)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Estimated fees</dt><dd>{fmtUSD(fee)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">{side === "BUY" ? "Available cash" : "Holding"}</dt><dd>{side === "BUY" ? fmtUSD(cash) : `${fmtQty(held)} ${symbol}`}</dd></div>
        </dl>
        {reason && <p className="text-xs text-loss">{reason}</p>}
        <Button data-tour="preview" disabled={invalid} variant={side === "BUY" ? "gain" : "loss"} className="w-full" onClick={() => setPreview(true)}>Preview order</Button>
        <p className="text-center text-[0.65rem] tracking-wider text-muted-foreground">VIRTUAL MONEY — NO REAL MONEY INVOLVED</p>
      </div>
    </div>
  );
}

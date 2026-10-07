import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { ASSETS, getAsset } from "./market";

export type Side = "BUY" | "SELL";
export type Mode = "practice" | "realistic" | "challenge" | "historical";

export interface Position { symbol: string; qty: number; avg: number; openedAt: number; stopLoss?: number; takeProfit?: number }
export interface Tx { id: string; symbol: string; type: Side | "DEPOSIT" | "RESET"; qty: number; price: number; fee: number; ts: number; note?: string }
export interface PendingOrder { id: string; symbol: string; side: Side; qty: number; limit: number; ts: number }
export interface Activity { id: string; kind: "trade" | "deposit" | "challenge" | "lesson" | "badge"; text: string; ts: number }

export const BADGES = [
  { id: "first-trade", title: "FIRST TRADE", desc: "Complete your first virtual trade" },
  { id: "explorer", title: "MARKET EXPLORER", desc: "View 5 different asset pages" },
  { id: "risk-manager", title: "RISK MANAGER", desc: "Open a trade with a stop loss" },
  { id: "diversified", title: "DIVERSIFIED", desc: "Hold 5 different assets" },
  { id: "day-trader", title: "DAY TRADER", desc: "Complete 10 simulated trades" },
  { id: "investor-30", title: "30-DAY INVESTOR", desc: "Hold a position for 30 days" },
  { id: "scholar", title: "SCHOLAR", desc: "Complete 5 lessons" },
] as const;
export type BadgeId = (typeof BADGES)[number]["id"];

export const feeFor = (symbol: string, notional: number) => {
  const a = getAsset(symbol);
  return a && (a.category === "crypto" || a.category === "meme") ? notional * 0.001 : 0;
};
export const levelFor = (xp: number) => Math.floor(xp / 500) + 1;

interface State {
  onboarded: boolean;
  username: string;
  startingBalance: number;
  cash: number;
  mode: Mode;
  positions: Record<string, Position>;
  txs: Tx[];
  orders: PendingOrder[];
  watchlist: string[];
  activity: Activity[];
  xp: number;
  lessonsDone: string[];
  quiz: Record<string, number>;
  badges: Partial<Record<BadgeId, number>>;
  viewed: string[];
  usedStopLoss: boolean;
  history: { t: number; v: number }[];
  theme: "dark" | "light";
  notifications: boolean;
  tutorialStep: number;
  // actions
  start: (balance: number, tutorial: boolean) => void;
  trade: (symbol: string, side: Side, qty: number, price: number, opts?: { stopLoss?: number; takeProfit?: number; silent?: boolean }) => boolean;
  placeLimit: (symbol: string, side: Side, qty: number, limit: number) => void;
  cancelOrder: (id: string) => void;
  toggleWatch: (symbol: string) => void;
  completeLesson: (id: string, title: string, xp: number, score?: number) => void;
  markViewed: (symbol: string) => void;
  addXp: (n: number, reason: string) => void;
  deposit: (n: number) => void;
  setBracket: (symbol: string, sl?: number, tp?: number) => void;
  set: (p: Partial<State>) => void;
  recordValue: (v: number) => void;
  reset: (balance?: number) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const initial = {
  onboarded: false,
  username: "trader_" + Math.floor(Math.random() * 9000 + 1000),
  startingBalance: 100000,
  cash: 100000,
  mode: "realistic" as Mode,
  positions: {},
  txs: [],
  orders: [],
  watchlist: ["AAPL", "NVDA", "BTC", "ETH", "SPY"],
  activity: [],
  xp: 0,
  lessonsDone: [],
  quiz: {},
  badges: {},
  viewed: [],
  usedStopLoss: false,
  history: [],
  tutorialStep: 0,
};

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const log = (kind: Activity["kind"], text: string) =>
        set((s) => ({ activity: [{ id: uid(), kind, text, ts: Date.now() }, ...s.activity].slice(0, 60) }));

      const unlock = (id: BadgeId) => {
        if (get().badges[id]) return;
        const b = BADGES.find((x) => x.id === id)!;
        set((s) => ({ badges: { ...s.badges, [id]: Date.now() }, xp: s.xp + 100 }));
        log("badge", `Unlocked badge: ${b.title}`);
        toast.success(`Achievement unlocked — ${b.title}`, { description: "+100 XP" });
      };

      const checkBadges = () => {
        const s = get();
        const trades = s.txs.filter((t) => t.type === "BUY" || t.type === "SELL").length;
        if (trades >= 1) unlock("first-trade");
        if (trades >= 10) unlock("day-trader");
        if (Object.keys(s.positions).length >= 5) unlock("diversified");
        if (s.usedStopLoss) unlock("risk-manager");
        if (s.viewed.length >= 5) unlock("explorer");
        if (s.lessonsDone.length >= 5) unlock("scholar");
        if (Object.values(s.positions).some((p) => Date.now() - p.openedAt > 30 * 864e5)) unlock("investor-30");
      };

      return {
        ...initial,
        theme: "dark",
        notifications: true,
        start: (balance, tutorial) => {
          set({ ...initial, username: get().username, onboarded: true, startingBalance: balance, cash: balance, tutorialStep: tutorial ? 1 : 0, history: [{ t: Date.now(), v: balance }] });
          log("deposit", `Virtual account funded with $${balance.toLocaleString()}`);
        },
        trade: (symbol, side, qty, price, opts = {}) => {
          const s = get();
          if (!(qty > 0) || !(price > 0)) return false;
          const notional = qty * price;
          const fee = feeFor(symbol, notional);
          const pos = s.positions[symbol];
          if (side === "BUY") {
            if (s.mode !== "practice" && notional + fee > s.cash + 1e-9) {
              toast.error("Insufficient virtual cash", { description: "Reduce quantity or sell a position." });
              return false;
            }
            const newQty = (pos?.qty ?? 0) + qty;
            const avg = pos ? (pos.avg * pos.qty + notional) / newQty : price;
            const positions = { ...s.positions, [symbol]: { symbol, qty: newQty, avg, openedAt: pos?.openedAt ?? Date.now(), stopLoss: opts.stopLoss ?? pos?.stopLoss, takeProfit: opts.takeProfit ?? pos?.takeProfit } };
            set({ cash: s.cash - notional - fee, positions, usedStopLoss: s.usedStopLoss || !!opts.stopLoss });
          } else {
            if (!pos || pos.qty + 1e-12 < qty) {
              toast.error("Not enough to sell", { description: `You hold ${pos?.qty ?? 0} ${symbol}.` });
              return false;
            }
            const positions = { ...s.positions };
            const left = pos.qty - qty;
            if (left <= 1e-12) delete positions[symbol];
            else positions[symbol] = { ...pos, qty: left };
            set({ cash: s.cash + notional - fee, positions });
          }
          const tx: Tx = { id: uid(), symbol, type: side, qty, price, fee, ts: Date.now() };
          set((st) => ({ txs: [tx, ...st.txs], xp: st.xp + 10 }));
          log("trade", `${side === "BUY" ? "Bought" : "Sold"} ${+qty.toFixed(6)} ${symbol} @ $${price.toLocaleString(undefined, { maximumFractionDigits: 8 })}`);
          if (!opts.silent) toast.success(`Virtual ${side.toLowerCase()} filled`, { description: `${+qty.toFixed(6)} ${symbol} · +10 XP` });
          checkBadges();
          return true;
        },
        placeLimit: (symbol, side, qty, limit) => {
          set((s) => ({ orders: [{ id: uid(), symbol, side, qty, limit, ts: Date.now() }, ...s.orders] }));
          toast(`Limit ${side.toLowerCase()} placed`, { description: `${qty} ${symbol} @ $${limit}` });
        },
        cancelOrder: (id) => set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),
        toggleWatch: (symbol) => {
          const has = get().watchlist.includes(symbol);
          set((s) => ({ watchlist: has ? s.watchlist.filter((x) => x !== symbol) : [...s.watchlist, symbol] }));
          toast(has ? `Removed ${symbol} from watchlist` : `Added ${symbol} to watchlist`);
        },
        completeLesson: (id, title, xp, score) => {
          if (get().lessonsDone.includes(id)) {
            if (score !== undefined) set((s) => ({ quiz: { ...s.quiz, [id]: Math.max(score, s.quiz[id] ?? 0) } }));
            return;
          }
          set((s) => ({ lessonsDone: [...s.lessonsDone, id], xp: s.xp + xp, quiz: score !== undefined ? { ...s.quiz, [id]: score } : s.quiz }));
          log("lesson", `Completed lesson: ${title}`);
          toast.success(`Lesson complete · +${xp} XP`, { description: title });
          checkBadges();
        },
        markViewed: (symbol) => {
          if (get().viewed.includes(symbol)) return;
          set((s) => ({ viewed: [...s.viewed, symbol] }));
          checkBadges();
        },
        addXp: (n, reason) => {
          set((s) => ({ xp: s.xp + n }));
          log("challenge", reason);
        },
        deposit: (n) => {
          set((s) => ({ cash: s.cash + n, txs: [{ id: uid(), symbol: "USD", type: "DEPOSIT", qty: n, price: 1, fee: 0, ts: Date.now() }, ...s.txs] }));
          log("deposit", `Added $${n.toLocaleString()} virtual cash (practice mode)`);
          toast.success(`+$${n.toLocaleString()} virtual cash`);
        },
        setBracket: (symbol, sl, tp) => {
          const p = get().positions[symbol];
          if (!p) return;
          set((s) => ({ positions: { ...s.positions, [symbol]: { ...p, stopLoss: sl, takeProfit: tp } }, usedStopLoss: s.usedStopLoss || !!sl }));
          checkBadges();
          toast("Bracket updated", { description: `${symbol} SL ${sl ?? "—"} · TP ${tp ?? "—"}` });
        },
        set: (p) => set(p),
        recordValue: (v) => set((s) => ({ history: [...s.history, { t: Date.now(), v }].slice(-400) })),
        reset: (balance) => {
          const b = balance ?? get().startingBalance;
          set({ ...initial, username: get().username, onboarded: true, startingBalance: b, cash: b, history: [{ t: Date.now(), v: b }], theme: get().theme });
          toast("Simulation reset", { description: `Fresh start with $${b.toLocaleString()} virtual cash.` });
        },
      };
    },
    { name: "marketlab-v1", partialize: ({ ...s }) => s },
  ),
);

/* ---------- Live (simulated) prices ---------- */
interface PriceState { prices: Record<string, number>; open: Record<string, number>; tick: number }
export const usePrices = create<PriceState>(() => {
  const prices: Record<string, number> = {};
  const open: Record<string, number> = {};
  ASSETS.forEach((a, i) => {
    const drift = Math.sin(i * 12.9898) * a.vol * 0.8;
    open[a.symbol] = a.basePrice;
    prices[a.symbol] = a.basePrice * (1 + drift);
  });
  return { prices, open, tick: 0 };
});

let started = false;
export function startTicker() {
  if (started || typeof window === "undefined") return;
  started = true;
  setInterval(() => {
    const { prices } = usePrices.getState();
    const next: Record<string, number> = {};
    for (const a of ASSETS) {
      const p = prices[a.symbol];
      const shock = (Math.random() - 0.5) * a.vol * 0.12;
      next[a.symbol] = Math.max(p * (1 + shock), a.basePrice * 0.05);
    }
    usePrices.setState((s) => ({ prices: next, tick: s.tick + 1 }));

    const st = useStore.getState();
    // fill limit orders
    for (const o of st.orders) {
      const px = next[o.symbol];
      if ((o.side === "BUY" && px <= o.limit) || (o.side === "SELL" && px >= o.limit)) {
        useStore.getState().cancelOrder(o.id);
        useStore.getState().trade(o.symbol, o.side, o.qty, o.limit);
      }
    }
    // stop-loss / take-profit
    for (const p of Object.values(useStore.getState().positions)) {
      const px = next[p.symbol];
      if (p.stopLoss && px <= p.stopLoss) {
        useStore.getState().trade(p.symbol, "SELL", p.qty, px, { silent: true });
        toast.warning(`Stop loss triggered on ${p.symbol}`, { description: "Position closed to limit the loss." });
      } else if (p.takeProfit && px >= p.takeProfit) {
        useStore.getState().trade(p.symbol, "SELL", p.qty, px, { silent: true });
        toast.success(`Take profit hit on ${p.symbol}`, { description: "Gains locked in." });
      }
    }
    const s2 = useStore.getState();
    if (s2.onboarded && usePrices.getState().tick % 5 === 0) {
      const v = s2.cash + Object.values(s2.positions).reduce((sum, p) => sum + p.qty * next[p.symbol], 0);
      s2.recordValue(v);
    }
  }, 2000);
}

export function usePortfolio() {
  const { cash, positions, startingBalance, txs } = useStore();
  const { prices, open } = usePrices();
  const holdings = Object.values(positions).map((p) => {
    const price = prices[p.symbol];
    const value = p.qty * price;
    const cost = p.qty * p.avg;
    return { ...p, price, value, pl: value - cost, plPct: (value / cost - 1) * 100, dayPl: p.qty * (price - Math.max(open[p.symbol], 0)) };
  });
  const invested = holdings.reduce((s, h) => s + h.value, 0);
  const total = cash + invested;
  const deposits = txs.filter((t) => t.type === "DEPOSIT").reduce((s, t) => s + t.qty, 0);
  const basis = startingBalance + deposits;
  const totalPl = total - basis;
  const dayPl = holdings.reduce((s, h) => s + h.dayPl, 0);
  return { cash, holdings, invested, total, totalPl, returnPct: (totalPl / basis) * 100, dayPl, buyingPower: cash };
}

export function changePct(symbol: string, prices: Record<string, number>, open: Record<string, number>) {
  return (prices[symbol] / open[symbol] - 1) * 100;
}

import { supabase } from "@/integrations/supabase/client";
import { levelFor, usePrices, useStore } from "./store";

const SKIP = new Set(["theme"]);
function snapshot() {
  const s = useStore.getState() as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(s)) if (typeof v !== "function" && !SKIP.has(k)) out[k] = v;
  return out;
}

let unsub: (() => void) | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let activeUser: string | null = null;

/** Load this user's saved simulation from the cloud, then keep it in sync. */
export async function startSync(userId: string, fallbackName: string) {
  if (activeUser === userId) return;
  stopSync();
  activeUser = userId;
  const [{ data: row }, { data: profile }] = await Promise.all([
    supabase.from("user_state").select("state").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("username").eq("id", userId).maybeSingle(),
  ]);
  const username = profile?.username ?? fallbackName;
  if (row?.state && Object.keys(row.state as object).length) {
    useStore.setState({ ...(row.state as object), username });
  } else {
    // fresh account → fresh simulation
    useStore.getState().reset();
    useStore.setState({ onboarded: false, username });
  }
  unsub = useStore.subscribe(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void push(userId), 1500);
  });
}

async function push(userId: string) {
  const s = useStore.getState();
  if (!s.onboarded) return;
  const { prices } = usePrices.getState();
  const value = s.cash + Object.values(s.positions).reduce((a, p) => a + p.qty * (prices[p.symbol] ?? p.avg), 0);
  const deposits = s.txs.filter((t) => t.type === "DEPOSIT").reduce((a, t) => a + t.qty, 0);
  const basis = s.startingBalance + deposits;
  await Promise.all([
    supabase.from("user_state").upsert({ user_id: userId, state: snapshot() as never, updated_at: new Date().toISOString() }),
    supabase.from("profiles").update({
      username: s.username,
      xp: s.xp,
      level: levelFor(s.xp),
      virtual_cash: s.cash,
      starting_balance: s.startingBalance,
      portfolio_value: value,
      return_pct: +(((value - basis) / basis) * 100).toFixed(4),
      trades_count: s.txs.filter((t) => t.type === "BUY" || t.type === "SELL").length,
      badges_count: Object.keys(s.badges).length,
      tutorial_progress: s.lessonsDone.length,
      updated_at: new Date().toISOString(),
    }).eq("id", userId),
  ]);
}

export function stopSync() {
  unsub?.();
  unsub = null;
  if (timer) clearTimeout(timer);
  activeUser = null;
}

import { useStore } from "./store";

type S = ReturnType<typeof useStore.getState>;
export const CHALLENGES = [
  { id: "first", title: "FIRST TRADE", desc: "Complete your first virtual trade.", period: "DAILY", xp: 100, goal: 1, progress: (s: S) => s.txs.filter((t) => t.type === "BUY" || t.type === "SELL").length },
  { id: "diversify", title: "DIVERSIFY", desc: "Hold at least 5 different assets.", period: "WEEKLY", xp: 200, goal: 5, progress: (s: S) => Object.keys(s.positions).length },
  { id: "risk", title: "RISK MANAGER", desc: "Complete a trade using a stop loss.", period: "WEEKLY", xp: 150, goal: 1, progress: (s: S) => (s.usedStopLoss ? 1 : 0) },
  { id: "long", title: "LONG TERM", desc: "Hold a position for 30 simulated days.", period: "WEEKLY", xp: 300, goal: 30, progress: (s: S) => Math.floor(Math.max(0, ...Object.values(s.positions).map((p) => (Date.now() - p.openedAt) / 864e5))) },
  { id: "day", title: "DAY TRADER", desc: "Complete 10 simulated trades.", period: "WEEKLY", xp: 250, goal: 10, progress: (s: S) => s.txs.filter((t) => t.type === "BUY" || t.type === "SELL").length },
  { id: "learner", title: "STUDENT OF THE GAME", desc: "Finish 3 lessons today.", period: "DAILY", xp: 120, goal: 3, progress: (s: S) => s.lessonsDone.length },
] as const;

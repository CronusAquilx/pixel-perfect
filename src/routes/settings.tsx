import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageHeader, Panel } from "@/components/ml/bits";
import { useStore, type Mode } from "@/lib/store";
import { seo } from "@/lib/seo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => seo("Settings", "Theme, notifications, simulation mode and reset."),
  component: Settings,
});

const MODES: { id: Mode; title: string; desc: string }[] = [
  { id: "practice", title: "PRACTICE", desc: "Unlimited virtual money. Top up anytime." },
  { id: "realistic", title: "REALISTIC", desc: "Fixed balance, fees, no overspending." },
  { id: "challenge", title: "CHALLENGE", desc: "Fixed balance with objectives on the Challenges page." },
  { id: "historical", title: "HISTORICAL", desc: "Replay past scenarios — preview, data feed coming." },
];

function Row({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 border-b py-4 last:border-0"><div><div className="text-sm font-medium">{title}</div>{desc && <div className="text-xs text-muted-foreground">{desc}</div>}</div>{children}</div>;
}

function Settings() {
  const s = useStore();
  const [name, setName] = useState(s.username);
  const [bal, setBal] = useState(s.startingBalance);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Settings" />
      <Panel title="Account">
        <Row title="Username"><div className="flex gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 w-44" /><Button size="sm" variant="outline" onClick={() => { s.set({ username: name.trim() || s.username }); toast("Username saved"); }}>Save</Button></div></Row>
        <Row title="Light mode" desc="Dark is the default."><Switch checked={s.theme === "light"} onCheckedChange={(v) => s.set({ theme: v ? "light" : "dark" })} /></Row>
        <Row title="Notifications" desc="Show unread dot for new activity."><Switch checked={s.notifications} onCheckedChange={(v) => s.set({ notifications: v })} /></Row>
        <Row title="Data source" desc="Currently simulated market data. Live feeds can be connected later."><span className="label-caps">Simulated</span></Row>
      </Panel>
      <Panel title="Simulation mode">
        <div className="grid gap-2 sm:grid-cols-2">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => { s.set({ mode: m.id }); toast(`${m.title} mode on`); }} className={cn("rounded-md border p-3 text-left", s.mode === m.id && "border-gain bg-gain/5")}>
              <div className="text-sm font-semibold tracking-wider">{m.title}</div><div className="text-xs text-muted-foreground">{m.desc}</div>
            </button>
          ))}
        </div>
        {s.mode === "practice" && <Button variant="terminal" className="mt-3" onClick={() => s.deposit(10000)}>Add $10,000 virtual cash</Button>}
      </Panel>
      <Panel title="Tutorial & reset">
        <Row title="Restart tutorial" desc="Replays the guided first trade."><Button size="sm" variant="outline" onClick={() => { s.set({ tutorialStep: 1 }); toast("Tutorial restarted"); }}>Restart</Button></Row>
        <Row title="Starting balance">
          <div className="flex gap-1">{[10000, 50000, 100000].map((b) => <button key={b} onClick={() => setBal(b)} className={cn("num rounded border px-2 py-1 text-xs", bal === b && "bg-foreground text-background")}>${b / 1000}k</button>)}</div>
        </Row>
        <Row title="RESET SIMULATION" desc="Clears positions, history, XP and badges.">
          <AlertDialog>
            <AlertDialogTrigger asChild><Button size="sm" variant="loss">Reset</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Reset your simulation?</AlertDialogTitle><AlertDialogDescription>All virtual positions, trades, XP and badges will be erased. You'll restart with ${bal.toLocaleString()}.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => s.reset(bal)}>Reset simulation</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Row>
      </Panel>
    </div>
  );
}

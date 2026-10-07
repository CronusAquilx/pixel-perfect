import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Tag } from "@/components/ml/bits";
import { CHALLENGES } from "@/lib/challenges";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { toast } from "sonner";

export const Route = createFileRoute("/challenges")({
  head: () => seo("Challenges", "Daily and weekly trading challenges that reward skill and discipline."),
  component: Challenges,
});

function Challenges() {
  const s = useStore();
  const claimed = (s as unknown as { claimed?: string[] }).claimed ?? [];
  const claim = (id: string, title: string, xp: number) => {
    s.set({ claimed: [...claimed, id] } as never);
    s.addXp(xp, `Completed challenge: ${title}`);
    toast.success(`Challenge complete — ${title}`, { description: `+${xp} XP` });
  };
  return (
    <>
      <PageHeader title="Challenges" sub="Rewards for disciplined habits — never for reckless risk." />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {CHALLENGES.map((c) => {
          const prog = Math.min(c.goal, c.progress(s));
          const done = prog >= c.goal;
          const isClaimed = claimed.includes(c.id);
          return (
            <Panel key={c.id}>
              <div className="flex justify-between"><Tag>{c.period}</Tag><Tag tone="gain">+{c.xp} XP</Tag></div>
              <div className="mt-3 font-semibold tracking-wider">{c.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              <div className="num mt-4 flex justify-between text-xs"><span>{prog} / {c.goal}</span><span>{Math.round((prog / c.goal) * 100)}%</span></div>
              <div className="mt-1 h-1.5 rounded bg-muted"><div className="h-full rounded bg-gain transition-all" style={{ width: `${(prog / c.goal) * 100}%` }} /></div>
              <Button variant={done && !isClaimed ? "gain" : "outline"} size="sm" disabled={!done || isClaimed} className="mt-4 w-full" onClick={() => claim(c.id, c.title, c.xp)}>
                {isClaimed ? "Claimed" : done ? "Claim reward" : "In progress"}
              </Button>
            </Panel>
          );
        })}
      </div>
    </>
  );
}

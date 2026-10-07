import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Tag } from "@/components/ml/bits";
import { LESSONS, TUTORIAL } from "@/lib/content";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/learn/")({
  head: () => seo("Learning Center", "Interactive lessons on investing, charts, risk and strategy — with quizzes and XP."),
  component: Learn,
});

function Learn() {
  const { lessonsDone, set } = useStore();
  const tut = TUTORIAL.filter((t) => lessonsDone.includes(t.lesson)).length;
  return (
    <>
      <PageHeader title="Learn" sub="Every lesson has an explanation, an interactive example, and a quiz." action={<Button variant="terminal" onClick={() => set({ tutorialStep: 1 })}>Start guided first trade</Button>} />
      <Panel title="Interactive tutorial">
        <div className="mb-3 flex items-center justify-between text-sm"><span>{tut} / 10 Lessons Completed</span><span className="num text-muted-foreground">{tut * 10}%</span></div>
        <div className="mb-4 h-1.5 rounded bg-muted"><div className="h-full rounded bg-gain transition-all" style={{ width: `${tut * 10}%` }} /></div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {TUTORIAL.map((t) => {
            const done = lessonsDone.includes(t.lesson);
            return (
              <Link key={t.n} to="/learn/$id" params={{ id: t.lesson }} className="rounded-md border p-3 text-sm transition-colors hover:bg-accent">
                <div className="flex items-center justify-between"><span className="label-caps">Lesson {t.n}</span>{done && <Check className="h-4 w-4 text-gain" />}</div>
                <div className="mt-1 font-medium">{t.title}</div>
              </Link>
            );
          })}
        </div>
      </Panel>
      {(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((lvl) => (
        <section key={lvl} className="mt-8">
          <h2 className="label-caps mb-3">{lvl}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {LESSONS.filter((l) => l.level === lvl).map((l) => (
              <Link key={l.id} to="/learn/$id" params={{ id: l.id }} className="panel p-4 transition-colors hover:bg-accent">
                <div className="flex justify-between"><Tag tone={lessonsDone.includes(l.id) ? "gain" : "muted"}>{lessonsDone.includes(l.id) ? "DONE" : `+${l.xp} XP`}</Tag></div>
                <div className="mt-3 font-medium">{l.title}</div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{l.body[0]}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

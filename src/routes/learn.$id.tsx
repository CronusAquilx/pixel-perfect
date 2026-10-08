import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Panel, Tag } from "@/components/ml/bits";
import { PriceChart } from "@/components/ml/charts";
import { LESSONS, type Widget } from "@/lib/content";
import { fmtUSD } from "@/lib/market";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { LessonVideoPlayer } from "@/components/ml/LessonVideo";
import { seo } from "@/lib/seo";
import { LessonPractice } from "@/components/ml/LessonPractice";

export const Route = createFileRoute("/learn/$id")({
  loader: ({ params }) => {
    const l = LESSONS.find((x) => x.id === params.id);
    if (!l) throw notFound();
    return { id: l.id, title: l.title, lesson: l };
  },
  head: ({ loaderData }) => {
    return seo(loaderData ? `${loaderData.title} · Learn` : "Lesson not found", `Learn ${loaderData?.title ?? "investing"} with a narrated video, hands-on practice, and a quiz. Virtual money only.`);
  },
  notFoundComponent: () => <p className="p-10 text-center">Lesson not found. <Link to="/learn" className="underline">Back</Link></p>,
  component: LessonPage,
});

function LessonPage() {
  const { lesson } = Route.useLoaderData();
  return <LessonContent key={lesson.id} l={lesson} />;
}

function LessonContent({ l }: { l: (typeof LESSONS)[number] }) {
  const { completeLesson, lessonsDone } = useStore();
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const score = l.quiz.filter((q, i) => answers[i] === q.answer).length;
  const next = LESSONS[LESSONS.indexOf(l) + 1];
  const submit = () => {
    setSubmitted(true);
    if (score === l.quiz.length) completeLesson(l.id, l.title, l.xp, score);
  };
  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/learn" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Learn</Link>
      <div className="flex gap-2"><Tag>{l.level}</Tag><Tag tone="gain">+{l.xp} XP</Tag>{lessonsDone.includes(l.id) && <Tag tone="gain">COMPLETED</Tag>}</div>
      <h1 className="mt-2 text-3xl font-semibold">{l.title}</h1>
      <div className="mt-4 space-y-3 text-muted-foreground">{l.body.map((b) => <p key={b}>{b}</p>)}</div>
      <LessonVideoPlayer key={l.id} id={l.id} title={l.title}>{l.id !== "candles" && <WidgetView w={l.widget} />}<LessonPractice id={l.id} /></LessonVideoPlayer>
      <Panel title="Mini quiz" className="mt-4">
        <div className="space-y-5">
          {l.quiz.map((q, qi) => (
            <div key={qi}>
              <div className="mb-2 font-medium">{q.q}</div>
              <div className="grid gap-2">
                {q.options.map((o, oi) => {
                  const picked = answers[qi] === oi;
                  return (
                    <Button variant="outline" aria-pressed={picked} key={oi} onClick={() => { setSubmitted(false); const a = [...answers]; a[qi] = oi; setAnswers(a); }}
                      className={cn("h-auto justify-start whitespace-normal px-3 py-2 text-left text-sm", picked && "border-foreground", submitted && picked && (oi === q.answer ? "border-gain bg-gain/10" : "border-loss bg-loss/10"))}>{o}</Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button variant="gain" disabled={answers.filter((a) => a !== undefined).length < l.quiz.length} onClick={submit}>Submit answers</Button>
          {submitted && <span className={cn("text-sm", score === l.quiz.length ? "text-gain" : "text-loss")}>{score}/{l.quiz.length} correct{score < l.quiz.length && " — try again"}</span>}
          {submitted && score === l.quiz.length && next && <Button asChild variant="outline" className="h-auto whitespace-normal"><Link to="/learn/$id" params={{ id: next.id }}>Next: {next.title}</Link></Button>}
        </div>
      </Panel>
    </div>
  );
}

function WidgetView({ w }: { w: Widget }) {
  const [a, setA] = useState(10);
  const [b, setB] = useState(7);
  const [riskPct, setRiskPct] = useState(1);
  const [stopPct, setStopPct] = useState(5);
  const [assets, setAssets] = useState(5);
  if (w === "compound") {
    const fv = 10000 * Math.pow(1 + b / 100, a);
    return <div className="space-y-4 text-sm">
      <p>$10,000 growing at an assumed <b>{b}%</b> per year for <b>{a} years</b> becomes <span className="num text-gain text-lg">{fmtUSD(fv)}</span>. Actual returns vary and can be negative.</p>
      <label className="block">Years<Slider value={[a]} min={1} max={40} onValueChange={(v) => setA(v[0])} className="mt-2" /></label>
      <label className="block">Annual return<Slider value={[b]} min={1} max={15} onValueChange={(v) => setB(v[0])} className="mt-2" /></label>
    </div>;
  }
  if (w === "position") {
    const risk = 10000 * riskPct / 100;
    const size = risk / stopPct;
    return <div className="space-y-4 text-sm">
      <p>Account $10,000. Risking <b>{riskPct}%</b> with a stop <b>{stopPct}%</b> below a $100 entry → calculated size <span className="num text-gain">{size.toFixed(1)} shares</span> (planned loss {fmtUSD(risk)}).</p>
      {size * 100 > 10000 && <p className="text-warn">This size costs more than your account. Reduce the size; don’t assume borrowed money.</p>}
      <label className="block">Risk per trade: {riskPct}%<Slider value={[riskPct]} min={0.5} max={4} step={0.5} onValueChange={(v) => setRiskPct(v[0])} className="mt-2" /></label>
      <label className="block">Stop distance: {stopPct}%<Slider value={[stopPct]} min={1} max={10} onValueChange={(v) => setStopPct(v[0])} className="mt-2" /></label>
      <p className="text-xs text-muted-foreground">Planned loss = account × risk %. Shares = planned loss ÷ loss per share. Fees and price gaps can increase actual losses.</p>
    </div>;
  }
  if (w === "volatility") {
    return <div className="space-y-4 text-sm">
      <p>A <b>{a}%</b> move takes a $1,000 position down to <span className="num text-loss">{fmtUSD(1000 * (1 - a / 100))}</span> or up to <span className="num text-gain">{fmtUSD(1000 * (1 + a / 100))}</span>. This is an example, not a predicted daily range.</p>
      <label className="block">Example price move<Slider value={[a]} min={1} max={30} onValueChange={(v) => setA(v[0])} className="mt-2" /></label>
      <div className="text-xs text-muted-foreground">Bigger swings mean more uncertainty in both directions.</div>
    </div>;
  }
  if (w === "order") {
    return <div className="grid gap-3 text-sm sm:grid-cols-2">
      <div className="rounded-md bg-muted p-3"><b>Market</b><p className="mt-1 text-muted-foreground">Price now $100.40 → fills instantly at ~$100.40 (could slip).</p></div>
      <div className="rounded-md bg-muted p-3"><b>Limit $99.00</b><p className="mt-1 text-muted-foreground">Waits. Fills only if price drops to $99.00 — or never.</p></div>
    </div>;
  }
  if (w === "diversify") {
    const n = assets;
    return <div className="space-y-3 text-sm">
      <p>Holding <b>{n}</b> equal-weight assets, if one goes to zero you lose <span className="num text-loss">{(100 / n).toFixed(1)}%</span> of the portfolio.</p>
      <label className="block">Number of assets: {assets}<Slider value={[assets]} min={1} max={20} onValueChange={(v) => setAssets(v[0])} className="mt-2" /></label>
      <p className="text-xs text-muted-foreground">Assumes the other assets stay unchanged. Holdings in the same industry can fall together.</p>
    </div>;
  }
  return <div><p className="mb-2 text-sm text-muted-foreground">Live simulated SPY chart with a 10-period moving average (dashed). Switch timeframes to see how trends look at different scales.</p><PriceChart symbol="SPY" height={220} showMA /></div>;
}

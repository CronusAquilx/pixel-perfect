import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Tag } from "@/components/ml/bits";
import { market } from "@/lib/market";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/news")({
  head: () => seo("Market News", "Simulated market headlines linked to the assets they move."),
  component: News,
});

function News() {
  return (
    <>
      <PageHeader title="News" sub="Simulated headlines for practice. Not real reporting." />
      <div className="grid gap-3 md:grid-cols-2">
        {market.news().map((n) => (
          <Panel key={n.id}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><span>{n.source}</span>·<span>{n.minutesAgo < 60 ? `${n.minutesAgo}m ago` : `${Math.floor(n.minutesAgo / 60)}h ago`}</span></div>
            <h3 className="mt-2 font-semibold leading-snug">{n.headline}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{n.summary}</p>
            <Link to="/markets/$symbol" params={{ symbol: n.symbol }} className="mt-3 inline-block"><Tag tone="gain">{n.symbol} →</Tag></Link>
          </Panel>
        ))}
      </div>
    </>
  );
}

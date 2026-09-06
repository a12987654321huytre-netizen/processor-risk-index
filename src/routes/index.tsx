import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { PROVIDERS, RESEARCH_STATS, filterProviders, searchProviders } from "@/data";
import { rankProviders, riskiestFirst, safestFirst } from "@/data/scoring";
import { RankCards, RankTable } from "@/components/rank-table";
import { ResearchTracker } from "@/components/research-tracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LAST_RECALCULATED, LAST_VERIFIED, SUBLINE, TAGLINE } from "@/lib/site";
import { ScoreNumber } from "@/components/score";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Processor Risk Index — payment lockout research" },
      {
        name: "description",
        content: "Compare 50 major payment processors on lockout risk, funds-hold exposure, support quality and how hard they are to leave.",
      },
    ],
  }),
  component: Home,
});

type HomeView =
  | "all"
  | "riskiest"
  | "safest"
  | "researched"
  | "digital"
  | "saas"
  | "high-ticket"
  | "smb"
  | "enterprise";

const VIEWS: { id: HomeView; label: string }[] = [
  { id: "all", label: "All 50" },
  { id: "riskiest", label: "Riskiest" },
  { id: "safest", label: "Safest" },
  { id: "researched", label: "Most researched" },
  { id: "digital", label: "Digital products" },
  { id: "saas", label: "SaaS" },
  { id: "high-ticket", label: "High ticket" },
  { id: "smb", label: "SMBs" },
  { id: "enterprise", label: "Enterprise" },
];

function rowsFor(view: HomeView) {
  switch (view) {
    case "safest":
      return safestFirst(PROVIDERS);
    case "researched":
      return [...PROVIDERS].sort((a, b) => b.confidence - a.confidence || b.publishedOverall - a.publishedOverall);
    case "digital":
      return filterProviders({ model: "digital-downloads", sort: "risk-desc" });
    case "saas":
      return filterProviders({ model: "saas", sort: "risk-desc" });
    case "high-ticket":
      return filterProviders({ model: "high-ticket", sort: "risk-desc" });
    case "smb":
      return rankProviders([...PROVIDERS].filter((p) => p.focus !== "enterprise"));
    case "enterprise":
      return rankProviders([...PROVIDERS].filter((p) => p.focus !== "sme"));
    default:
      return riskiestFirst(PROVIDERS);
  }
}

function Home() {
  const [view, setView] = useState<HomeView>("all");
  const [q, setQ] = useState("");
  const rows = useMemo(() => rowsFor(view), [view]);
  const hits = q.trim() ? searchProviders(q).slice(0, 6) : [];

  return (
    <div>
      <section className="page-wrap pt-8 pb-6 md:pt-16 md:pb-8">
        <p className="text-xs uppercase tracking-[0.18em] text-accent font-medium">
          {PROVIDERS.length} major payment providers. Ranked by lockout risk.
        </p>
        <h1 className="mt-3 font-display text-3xl md:text-5xl max-w-3xl">{TAGLINE}</h1>
        <p className="mt-3 max-w-2xl text-ink-muted text-sm md:text-lg">{SUBLINE}</p>
        <p className="mt-2 max-w-2xl text-sm text-ink-subtle">
          Every provider receives a current Risk Index score. Evidence Confidence tells you how strongly the available research supports it.
        </p>
        <form
          className="mt-6 max-w-xl"
          onSubmit={(e) => {
            e.preventDefault();
            const first = searchProviders(q)[0];
            if (first) window.location.assign(`/processor/${first.slug}`);
          }}
        >
          <label htmlFor="home-search" className="sr-only">
            Search processors
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-subtle" />
            <Input
              id="home-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Stripe, PayPal, Adyen, Paddle…"
              className="pl-10"
            />
          </div>
          {hits.length > 0 ? (
            <ul className="mt-2 rounded-md border border-border bg-bg-elevated overflow-hidden">
              {hits.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/processor/$slug"
                    params={{ slug: p.slug }}
                    className="flex items-center justify-between px-3 py-2.5 text-sm hover:bg-surface"
                  >
                    <span>{p.name}</span>
                    <ScoreNumber value={p.publishedOverall} size="sm" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </form>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/rankings">
              See the rankings <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/methodology">How we score them</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-ink-subtle">This is something to understand, not panic about. Concentration matters more than the logo.</p>
        <div className="mt-6 max-w-xl">
          <ResearchTracker />
        </div>
      </section>

      <section className="page-wrap pb-12">
        <div className="flex flex-wrap gap-2 mb-3" role="tablist" aria-label="Homepage ranking views">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={view === v.id}
              onClick={() => setView(v.id)}
              className={
                view === v.id
                  ? "h-11 px-3 rounded-sm bg-ink text-bg text-sm"
                  : "h-11 px-3 rounded-sm bg-surface text-ink-muted text-sm hover:text-ink"
              }
            >
              {v.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-ink-muted mb-4">
          Showing {rows.length} of {RESEARCH_STATS.total}
          {rows.length === RESEARCH_STATS.total ? ", #1 through #" + RESEARCH_STATS.total : ""}. {RESEARCH_STATS.highConfidence}{" "}
          high-confidence · {RESEARCH_STATS.mediumConfidence} medium-confidence · {RESEARCH_STATS.lowConfidence} lower-confidence.
          Higher = greater merchant lockout exposure. Not a probability of suspension.
        </p>
        <div className="hidden md:block">
          <RankTable rows={rows} />
        </div>
        <RankCards rows={rows} />
        <p className="mt-3 text-xs text-ink-subtle">
          Higher = greater merchant lockout exposure. Not a probability, credit rating, or allegation of wrongdoing.
          All payment processors involve trade-offs. Some are easier to live with than others, and concentration matters.
        </p>
      </section>

      <section className="page-wrap grid gap-4 md:grid-cols-3 pb-16">
        <HomeCard
          to="/how-cooked"
          title="How cooked are you?"
          body="Provider risk is one number. Your exposure is how concentrated the setup is."
        />
        <HomeCard
          to="/escape"
          title="Build your escape hatch"
          body="Primary card, backup card, independent bank-payment. A backup is sensible, not an evacuation order."
        />
        <HomeCard
          to="/methodology"
          title="How we score them"
          body="Seven dimensions, cited terms, complaint bias, popularity bias. Scores are not jokes. The headlines can be."
        />
      </section>

      <section className="page-wrap grid gap-4 md:grid-cols-2 pb-16">
        <HomeCard
          to="/for"
          title="By business type"
          body="Digital goods, SaaS, high ticket, marketplaces, freelancers — different blast radii."
        />
        <HomeCard
          to="/country"
          title="By merchant country"
          body="Who can actually open an account if the company is incorporated there. Not who can pay."
        />
      </section>

      <section className="page-wrap pb-16">
        <h2 className="font-display text-2xl">What this is not</h2>
        <ul className="mt-4 grid gap-0 text-sm text-ink-muted border-t border-border">
          <li className="border-b border-border py-3">Not a fee comparison. Your 2.9% is not the scary bit.</li>
          <li className="border-b border-border py-3">Not an affiliate ranking. They can buy an ad. They cannot buy a better score.</li>
          <li className="border-b border-border py-3">Not a claim that Reddit is a court. Anecdotes are labelled. Contracts are cited.</li>
          <li className="border-b border-border py-3">Not legal advice. Read the agreement that actually governs your MID.</li>
        </ul>
        <p className="mt-6 text-sm">
          Last recalculated {LAST_RECALCULATED}. Last research pass {LAST_VERIFIED}.{" "}
          <Link to="/corrections" className="text-accent hover:underline">
            Think we got something wrong?
          </Link>
        </p>
      </section>
    </div>
  );
}

function HomeCard({ to, title, body }: { to: string; title: string; body: string }) {
  return (
    <Link to={to} className="border border-border bg-bg-elevated p-4 hover:border-border-strong block">
      <h2 className="font-sans text-lg font-medium">{title}</h2>
      <p className="mt-2 text-sm text-ink-muted">{body}</p>
    </Link>
  );
}

import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RESEARCH_STATS, filterProviders, type RankFilters } from "@/data";
import type { BusinessModel, ProviderType } from "@/data/types";
import { RankCards, RankTable } from "@/components/rank-table";
import { ResearchTracker } from "@/components/research-tracker";
import { Input, Label, Select } from "@/components/ui/input";
import { STATUS_TABS, TYPE_TABS, CONFIDENCE_TABS, typeContextNote } from "@/data/eligibility";

type Search = {
  q?: string;
  region?: string;
  type?: string;
  model?: string;
  risk?: string;
  confidence?: string;
  status?: string;
  sort?: string;
};

export const Route = createFileRoute("/rankings")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    region: typeof s.region === "string" ? s.region : undefined,
    type: typeof s.type === "string" ? s.type : undefined,
    model: typeof s.model === "string" ? s.model : undefined,
    risk: typeof s.risk === "string" ? s.risk : undefined,
    confidence: typeof s.confidence === "string" ? s.confidence : undefined,
    status: typeof s.status === "string" ? s.status : undefined,
    sort: typeof s.sort === "string" ? s.sort : undefined,
  }),
  head: () => ({
    meta: [{ title: "Rankings — Processor Risk Index" }],
  }),
  component: Rankings,
});

function Rankings() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const filters: RankFilters = {
    q: search.q,
    region: (search.region as RankFilters["region"]) || "all",
    type: (search.type as RankFilters["type"]) || "all",
    model: (search.model as RankFilters["model"]) || "all",
    risk: (search.risk as RankFilters["risk"]) || "all",
    confidence: (search.confidence as RankFilters["confidence"]) || "all",
    status: (search.status as RankFilters["status"]) || "all",
    sort: (search.sort as RankFilters["sort"]) || "risk-desc",
  };
  const rows = filterProviders(filters);

  function set(key: keyof Search, value: string) {
    void navigate({
      search: (prev) => ({ ...prev, [key]: value || undefined }),
    });
  }

  return (
    <div className="page-wrap py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-accent font-medium">Global top 50 · all ranked</p>
      <h1 className="mt-2 font-display text-4xl">Rankings</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        All {RESEARCH_STATS.total} major payment providers, ranked #1 through #{RESEARCH_STATS.total} by lockout risk.
        Rank 1 is the highest lockout-risk assessment, not a prize. Evidence Confidence is a separate number — it tells
        you how strongly the research supports the score, not whether the provider is allowed to appear.
      </p>

      <div className="mt-6">
        <ResearchTracker />
      </div>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Coverage">
        {CONFIDENCE_TABS.map((t) => {
          const active = t.id === "all" ? (search.confidence ?? "all") !== "high" && (search.status ?? "all") === "all" : search.confidence === "high";
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                if (t.id === "all") {
                  set("confidence", "");
                  set("status", "");
                } else {
                  set("confidence", "high");
                  set("status", "");
                }
              }}
              className={
                active
                  ? "h-10 px-3 rounded-sm bg-ink text-bg text-sm"
                  : "h-10 px-3 rounded-sm bg-surface text-ink-muted text-sm hover:text-ink"
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Research status">
        {STATUS_TABS.filter((t) => t.id !== "all").map((t) => {
          const active = (search.status ?? "all") === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => set("status", active ? "" : t.id)}
              className={
                active
                  ? "h-10 px-3 rounded-sm bg-ink text-bg text-sm"
                  : "h-10 px-3 rounded-sm bg-surface text-ink-muted text-sm hover:text-ink"
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Rankings by processor type">
        {TYPE_TABS.map((t) => {
          const active = (search.type ?? "all") === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              title={t.id === "all" ? undefined : typeContextNote()}
              onClick={() => set("type", t.id === "all" ? "" : t.id)}
              className={
                active
                  ? "h-10 px-3 rounded-sm bg-ink text-bg text-sm"
                  : "h-10 px-3 rounded-sm bg-surface text-ink-muted text-sm hover:text-ink"
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 sticky top-14 z-20 bg-bg py-3">
        <div className="sm:col-span-2">
          <Label htmlFor="rq">Search</Label>
          <Input id="rq" value={search.q ?? ""} onChange={(e) => set("q", e.target.value)} placeholder="Name or alias" />
        </div>
        <Field id="region" label="Geography" value={search.region ?? "all"} onChange={(v) => set("region", v)}>
          <option value="all">Global (all in index)</option>
          <option value="usa">USA</option>
          <option value="canada">Canada</option>
          <option value="uk">UK</option>
          <option value="eu">EU/EEA</option>
          <option value="latam">Latin America</option>
          <option value="india">India</option>
          <option value="apac">Asia-Pacific</option>
          <option value="mena">MENA</option>
          <option value="africa">Africa</option>
        </Field>
        <Field id="type" label="Processor type" value={search.type ?? "all"} onChange={(v) => set("type", v)}>
          <option value="all">Any type</option>
          {(
            [
              "direct-acquirer",
              "psp",
              "payment-aggregator",
              "gateway",
              "wallet",
              "merchant-of-record",
              "pay-by-bank",
              "platform-payments",
              "merchant-account-provider",
            ] as ProviderType[]
          ).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Field>
        <Field id="model" label="Business model" value={search.model ?? "all"} onChange={(v) => set("model", v)}>
          <option value="all">Any</option>
          {(
            ["ecommerce", "digital-downloads", "saas", "subscriptions", "marketplaces", "high-ticket", "physical-retail", "freelancers"] as BusinessModel[]
          ).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Field>
        <Field id="risk" label="Risk band" value={search.risk ?? "all"} onChange={(v) => set("risk", v)}>
          <option value="all">Any</option>
          <option value="low">Low</option>
          <option value="guarded">Guarded</option>
          <option value="moderate">Moderate</option>
          <option value="high">High</option>
          <option value="very-high">Very high</option>
          <option value="extreme">Extreme</option>
        </Field>
        <Field id="confidence" label="Evidence confidence" value={search.confidence ?? "all"} onChange={(v) => set("confidence", v)}>
          <option value="all">Any</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Field>
        <Field id="sort" label="Sort" value={search.sort ?? "risk-desc"} onChange={(v) => set("sort", v)}>
          <option value="risk-desc">Risk: high to low</option>
          <option value="risk-asc">Risk: low to high</option>
          <option value="confidence">Confidence</option>
          <option value="name">Name</option>
        </Field>
      </div>

      <p className="text-sm text-ink-muted mb-3">
        Showing {rows.length} of {RESEARCH_STATS.total}. {RESEARCH_STATS.ranked} ranked · {RESEARCH_STATS.highConfidence}{" "}
        high-confidence · {RESEARCH_STATS.mediumConfidence} medium · {RESEARCH_STATS.lowConfidence} lower.{" "}
        <Link to="/methodology" className="text-accent hover:underline">
          How scoring works
        </Link>
      </p>
      <div className="hidden md:block">
        <RankTable rows={rows} />
      </div>
      <RankCards rows={rows} />
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </Select>
    </div>
  );
}

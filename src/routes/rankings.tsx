import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { filterProviders, type RankFilters } from "@/data";
import type { BusinessModel, ProviderType } from "@/data/types";
import { RankCards, RankTable } from "@/components/rank-table";
import { Input, Label, Select } from "@/components/ui/input";

type Search = {
  q?: string;
  region?: string;
  type?: string;
  model?: string;
  risk?: string;
  confidence?: string;
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
      <p className="text-xs uppercase tracking-[0.18em] text-accent font-medium">Full index</p>
      <h1 className="mt-2 font-display text-4xl">Rankings</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Sortable lockout-risk table. Filters write into the URL so you can share a view. Geography uses sourced
        merchant onboarding, not “customers can pay from here”.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 sticky top-14 z-20 bg-bg py-3">
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
              "alternative-payment-method",
              "hybrid",
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
            [
              "ecommerce",
              "digital-downloads",
              "saas",
              "subscriptions",
              "services",
              "marketplaces",
              "high-ticket",
              "physical-retail",
              "freelancers",
            ] as BusinessModel[]
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
        {rows.length} processors.{" "}
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

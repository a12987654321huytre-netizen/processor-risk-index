import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { PROVIDERS, COUNTRIES } from "@/data";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { BandBadge, ScoreNumber } from "@/components/score";
import { evaluateCooked, type CookedInput } from "@/lib/cooked";

const KEY = "pri-cooked";

const empty: CookedInput = {
  processorId: "stripe",
  country: "US",
  industry: "ecommerce",
  product: "physical",
  volume: "10k-50k",
  aov: "50-200",
  largest: "under-500",
  chargebacks: "unknown",
  refunds: "unknown",
  accountAge: "3-12m",
  growth: "steady",
  fulfilment: "under-7d",
  subscription: false,
  crossBorder: false,
  backupId: "",
};

export const Route = createFileRoute("/how-cooked")({
  head: () => ({
    meta: [
      { title: "How cooked are you? — Processor Risk Index" },
      { name: "description", content: "A dependency check: processor risk times how much of the business sits on one account." },
    ],
  }),
  component: HowCooked,
});

function HowCooked() {
  const [form, setForm] = useState<CookedInput>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return { ...empty, ...(JSON.parse(raw) as CookedInput) };
    } catch {
      /* ignore */
    }
    return empty;
  });
  const [show, setShow] = useState(false);
  const result = useMemo(() => (show ? evaluateCooked(form) : null), [show, form]);

  function set<K extends keyof CookedInput>(k: K, v: CookedInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setShow(false);
  }

  return (
    <div className="page-wrap py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-accent font-medium">Dependency check</p>
      <h1 className="mt-2 font-display text-4xl">How cooked are you?</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        This is not a prediction. It combines the processor’s published index with how concentrated your setup looks.
        Do not use it to hide activity from compliance systems.
      </p>

      <form
        className="mt-8 grid gap-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            localStorage.setItem(KEY, JSON.stringify(form));
          } catch {
            /* ignore */
          }
          setShow(true);
        }}
      >
        <Field label="Current processor" htmlFor="processor">
          <Select id="processor" value={form.processorId} onChange={(e) => set("processorId", e.target.value)}>
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Merchant country (incorporation)" htmlFor="country">
          <Select id="country" value={form.country} onChange={(e) => set("country", e.target.value)}>
            {COUNTRIES.map((c) => (
              <option key={c.iso} value={c.iso}>
                {c.name}
              </option>
            ))}
            <option value="OTHER">Other / not listed</option>
          </Select>
        </Field>
        <Field label="Industry" htmlFor="industry">
          <Select id="industry" value={form.industry} onChange={(e) => set("industry", e.target.value)}>
            <option value="ecommerce">Ecommerce</option>
            <option value="saas">SaaS</option>
            <option value="digital">Digital products</option>
            <option value="services">Services</option>
            <option value="marketplace">Marketplace</option>
            <option value="retail">Physical retail</option>
          </Select>
        </Field>
        <Field label="What you sell" htmlFor="product">
          <Select id="product" value={form.product} onChange={(e) => set("product", e.target.value as CookedInput["product"])}>
            <option value="physical">Physical goods</option>
            <option value="digital">Digital</option>
            <option value="service">Service</option>
          </Select>
        </Field>
        <Field label="Monthly processing volume" htmlFor="volume">
          <Select id="volume" value={form.volume} onChange={(e) => set("volume", e.target.value as CookedInput["volume"])}>
            <option value="under-10k">Under $10k</option>
            <option value="10k-50k">$10k–$50k</option>
            <option value="50k-250k">$50k–$250k</option>
            <option value="250k-1m">$250k–$1m</option>
            <option value="over-1m">Over $1m</option>
          </Select>
        </Field>
        <Field label="Average order value" htmlFor="aov">
          <Select id="aov" value={form.aov} onChange={(e) => set("aov", e.target.value as CookedInput["aov"])}>
            <option value="under-50">Under $50</option>
            <option value="50-200">$50–$200</option>
            <option value="200-1k">$200–$1k</option>
            <option value="1k-5k">$1k–$5k</option>
            <option value="over-5k">Over $5k</option>
          </Select>
        </Field>
        <Field label="Largest transaction" htmlFor="largest">
          <Select id="largest" value={form.largest} onChange={(e) => set("largest", e.target.value as CookedInput["largest"])}>
            <option value="under-500">Under $500</option>
            <option value="500-2k">$500–$2k</option>
            <option value="2k-10k">$2k–$10k</option>
            <option value="over-10k">Over $10k</option>
          </Select>
        </Field>
        <Field label="Chargeback rate" htmlFor="cb">
          <Select id="cb" value={form.chargebacks} onChange={(e) => set("chargebacks", e.target.value as CookedInput["chargebacks"])}>
            <option value="unknown">Unknown</option>
            <option value="under-0.5">Under 0.5%</option>
            <option value="0.5-1">0.5–1%</option>
            <option value="over-1">Over 1%</option>
          </Select>
        </Field>
        <Field label="Refund rate" htmlFor="rf">
          <Select id="rf" value={form.refunds} onChange={(e) => set("refunds", e.target.value as CookedInput["refunds"])}>
            <option value="unknown">Unknown</option>
            <option value="under-5">Under 5%</option>
            <option value="5-15">5–15%</option>
            <option value="over-15">Over 15%</option>
          </Select>
        </Field>
        <Field label="Account age" htmlFor="age">
          <Select id="age" value={form.accountAge} onChange={(e) => set("accountAge", e.target.value as CookedInput["accountAge"])}>
            <option value="under-3m">Under 3 months</option>
            <option value="3-12m">3–12 months</option>
            <option value="over-12m">Over 12 months</option>
          </Select>
        </Field>
        <Field label="Recent growth" htmlFor="growth">
          <Select id="growth" value={form.growth} onChange={(e) => set("growth", e.target.value as CookedInput["growth"])}>
            <option value="flat">Flat</option>
            <option value="steady">Steady</option>
            <option value="spike">Sudden spike</option>
          </Select>
        </Field>
        <Field label="Fulfilment period" htmlFor="ful">
          <Select id="ful" value={form.fulfilment} onChange={(e) => set("fulfilment", e.target.value as CookedInput["fulfilment"])}>
            <option value="immediate">Immediate / digital delivery</option>
            <option value="under-7d">Under 7 days</option>
            <option value="over-7d">Over 7 days</option>
          </Select>
        </Field>
        <Field label="Subscriptions?" htmlFor="sub">
          <Select id="sub" value={form.subscription ? "yes" : "no"} onChange={(e) => set("subscription", e.target.value === "yes")}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </Select>
        </Field>
        <Field label="Cross-border payments?" htmlFor="xb">
          <Select id="xb" value={form.crossBorder ? "yes" : "no"} onChange={(e) => set("crossBorder", e.target.value === "yes")}>
            <option value="no">Mostly domestic</option>
            <option value="yes">Material cross-border</option>
          </Select>
        </Field>
        <Field label="Backup processor connected?" htmlFor="bak">
          <Select id="bak" value={form.backupId} onChange={(e) => set("backupId", e.target.value)}>
            <option value="">None</option>
            {PROVIDERS.filter((p) => p.id !== form.processorId).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="md:col-span-2">
          <Button type="submit">See how cooked</Button>
        </div>
      </form>

      {result ? (
        <section className="mt-10 rounded-lg border border-border bg-bg-elevated p-5">
          <p className="text-xs uppercase tracking-wide text-ink-subtle">Your dependency risk</p>
          <ScoreNumber value={result.score} size="lg" />
          <div className="mt-2">
            <BandBadge score={result.score} />
          </div>
          <p className="mt-3 text-sm text-ink-muted">
            Personalised from {result.processor.name}’s index, not a guarantee. {result.cheeky}
          </p>
          <h2 className="mt-6 font-display text-2xl">What we notice</h2>
          <ul className="mt-3 grid gap-2">
            {result.observations.map((o) => (
              <li key={o} className="text-sm text-ink-muted border-b border-border pb-2">
                {o}
              </li>
            ))}
          </ul>
          <h2 className="mt-6 font-display text-2xl">Fix this first</h2>
          <ol className="mt-3 list-decimal pl-5 text-sm space-y-1">
            {result.fixes.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ol>
          <p className="mt-6">
            <Link to="/escape" className="text-accent hover:underline">
              Build an escape hatch
            </Link>
            {" · "}
            <Link to="/processor/$slug" params={{ slug: result.processor.slug }} className="text-accent hover:underline">
              Open the {result.processor.name} dossier
            </Link>
          </p>
        </section>
      ) : null}
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

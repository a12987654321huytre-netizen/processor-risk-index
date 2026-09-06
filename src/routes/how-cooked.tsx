import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { PROVIDERS, COUNTRIES } from "@/data";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { ScoreNumber } from "@/components/score";
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
  independentRail: false,
  revenueShare: "all",
  cashBuffer: "1-3m",
};

export const Route = createFileRoute("/how-cooked")({
  head: () => ({
    meta: [
      { title: "How cooked are you? — Processor Risk Index" },
      { name: "description", content: "A dependency check: provider risk versus how badly this particular business would be hit." },
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
      <p className="meta text-accent">Dependency check</p>
      <h1 className="mt-2 font-display text-4xl">How cooked are you?</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        This is not a prediction. Provider risk is the dossier. Your exposure is how concentrated the setup is.
        A good result is allowed. Do not use it to hide activity from compliance systems.
      </p>

      <form
        className="mt-8 max-w-2xl grid gap-5"
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
        <Field label="Your processor" htmlFor="processor">
          <Select id="processor" value={form.processorId} onChange={(e) => set("processorId", e.target.value)}>
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="How much of your money goes through it?" htmlFor="rev">
          <Select id="rev" value={form.revenueShare} onChange={(e) => set("revenueShare", e.target.value as CookedInput["revenueShare"])}>
            <option value="all">All of it</option>
            <option value="most">Most of it</option>
            <option value="half">About half</option>
            <option value="minor">A minor rail</option>
          </Select>
        </Field>
        <Field label="Subscriptions too?" htmlFor="sub">
          <Select id="sub" value={form.subscription ? "yes" : "no"} onChange={(e) => set("subscription", e.target.value === "yes")}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </Select>
        </Field>
        <Field label="Backup processor?" htmlFor="bak">
          <Select id="bak" value={form.backupId} onChange={(e) => set("backupId", e.target.value)}>
            <option value="">None</option>
            {PROVIDERS.filter((p) => p.id !== form.processorId).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Another payment rail?" htmlFor="rail">
          <Select
            id="rail"
            value={form.independentRail ? "yes" : "no"}
            onChange={(e) => set("independentRail", e.target.value === "yes")}
          >
            <option value="no">No — cards only</option>
            <option value="yes">Yes — bank / local rail live</option>
          </Select>
        </Field>
        <Field label="Could you survive a 30-day payout freeze?" htmlFor="cash">
          <Select id="cash" value={form.cashBuffer} onChange={(e) => set("cashBuffer", e.target.value as CookedInput["cashBuffer"])}>
            <option value="under-1m">No — under a month of cash outside the processor</option>
            <option value="1-3m">Maybe — 1–3 months</option>
            <option value="over-3m">Yes — over 3 months sitting elsewhere</option>
          </Select>
        </Field>

        <p className="receipt pt-2">More about the shop</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Merchant country" htmlFor="country">
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
          <Field label="Monthly volume" htmlFor="volume">
            <Select id="volume" value={form.volume} onChange={(e) => set("volume", e.target.value as CookedInput["volume"])}>
              <option value="under-10k">Under $10k</option>
              <option value="10k-50k">$10k–$50k</option>
              <option value="50k-250k">$50k–$250k</option>
              <option value="250k-1m">$250k–$1m</option>
              <option value="over-1m">Over $1m</option>
            </Select>
          </Field>
          <Field label="Average order" htmlFor="aov">
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
          <Field label="Chargebacks" htmlFor="cb">
            <Select id="cb" value={form.chargebacks} onChange={(e) => set("chargebacks", e.target.value as CookedInput["chargebacks"])}>
              <option value="unknown">Unknown</option>
              <option value="under-0.5">Under 0.5%</option>
              <option value="0.5-1">0.5–1%</option>
              <option value="over-1">Over 1%</option>
            </Select>
          </Field>
          <Field label="Refunds" htmlFor="rf">
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
          <Field label="Fulfilment" htmlFor="ful">
            <Select id="ful" value={form.fulfilment} onChange={(e) => set("fulfilment", e.target.value as CookedInput["fulfilment"])}>
              <option value="immediate">Immediate / digital</option>
              <option value="under-7d">Under 7 days</option>
              <option value="over-7d">Over 7 days</option>
            </Select>
          </Field>
          <Field label="Cross-border?" htmlFor="xb">
            <Select id="xb" value={form.crossBorder ? "yes" : "no"} onChange={(e) => set("crossBorder", e.target.value === "yes")}>
              <option value="no">Mostly domestic</option>
              <option value="yes">Material cross-border</option>
            </Select>
          </Field>
        </div>
        <div>
          <Button type="submit">See how cooked</Button>
        </div>
      </form>

      {result ? (
        <section className="mt-10 border-t border-border pt-8">
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="receipt">Your provider risk</p>
              <ScoreNumber value={result.providerRisk} size="md" />
              <p className="mt-1 text-xs text-ink-subtle">The dossier. How intervention-prone {result.processor.name} looks.</p>
            </div>
            <div>
              <p className="receipt">Your business exposure</p>
              <ScoreNumber value={result.exposure} size="lg" />
              <p className="mt-2 text-xs uppercase tracking-wide font-medium">{result.bandLabel}</p>
              <p className="mt-1 text-xs text-ink-subtle">{result.cheeky}</p>
            </div>
          </div>
          <p className="mt-6 font-display text-2xl max-w-xl">{result.signature}</p>
          <p className="mt-2 text-sm text-ink-muted">
            Personalised from {result.processor.name}'s research, not a guarantee.
          </p>
          <h2 className="mt-8 font-sans text-lg font-medium">What we notice</h2>
          <ul className="mt-3">
            {result.observations.map((o) => (
              <li key={o} className="text-sm text-ink-muted border-b border-border py-2">
                {o}
              </li>
            ))}
          </ul>
          <h2 className="mt-8 font-sans text-lg font-medium">Fix this first</h2>
          <ol className="mt-3 list-decimal pl-5 text-sm space-y-1">
            {result.fixes.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ol>
          <p className="mt-6 text-sm">
            <Link to="/escape" className="text-accent hover:underline">
              Create an escape plan
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

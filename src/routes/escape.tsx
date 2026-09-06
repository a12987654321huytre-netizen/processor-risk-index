import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PROVIDERS, getProvider, infraWarnings, matchAlternatives } from "@/data";
import { Label, Select } from "@/components/ui/input";
import { ScoreNumber } from "@/components/score";

export const Route = createFileRoute("/escape")({
  head: () => ({
    meta: [
      { title: "Build your escape hatch — Processor Risk Index" },
      { name: "description", content: "Primary card rail, backup card, independent bank-payment, optional wallet and MoR — with infrastructure-overlap warnings." },
    ],
  }),
  component: Escape,
});

function Escape() {
  const [primary, setPrimary] = useState("stripe");
  const p = getProvider(primary);
  const matches = useMemo(() => (p ? matchAlternatives(p) : []), [p]);

  const backupCard =
    matches.find((m) => !m.provider.isMoR && m.provider.types.some((t) => t === "psp" || t === "direct-acquirer" || t === "payment-aggregator"))?.provider ??
    matches[0]?.provider;
  const bank = PROVIDERS.find((x) => x.types.includes("pay-by-bank") && x.id !== primary);
  const wallet = PROVIDERS.find((x) => x.types.includes("wallet") && x.id !== primary && x.id !== backupCard?.id);
  const mor = PROVIDERS.find((x) => x.isMoR && x.id !== primary);

  const ids = [primary, backupCard?.id, bank?.id, wallet?.id, mor?.id].filter((x): x is string => Boolean(x));
  const warnings = infraWarnings(ids);

  const independent = (a?: string, b?: string) => {
    if (!a || !b) return true;
    return infraWarnings([a, b]).length === 0;
  };

  return (
    <div className="page-wrap py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-accent font-medium">The emergency exit</p>
      <h1 className="mt-2 font-display text-4xl">Build your escape hatch</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Backup processor: cheaper than a nervous breakdown. Pick a primary. We suggest a stack and flag when two “different”
        logos share infrastructure.
      </p>

      <div className="mt-8 max-w-md">
        <Label htmlFor="primary">Primary processor</Label>
        <Select id="primary" value={primary} onChange={(e) => setPrimary(e.target.value)}>
          {PROVIDERS.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </Select>
      </div>

      {p ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card
            kicker="Primary card rail"
            name={p.name}
            slug={p.slug}
            score={p.scores.overall}
            note={p.isMoR ? "This primary is a Merchant of Record. Cards here are not ‘your’ MID." : p.acquiringModel}
            independent
          />
          <Card
            kicker="Backup card processor"
            name={backupCard?.name ?? "Add a second PSP"}
            slug={backupCard?.slug}
            score={backupCard?.scores.overall}
            note={
              backupCard
                ? independent(primary, backupCard.id)
                  ? "Different family from the primary on PRI’s overlap map."
                  : "Related infrastructure — this is not a real backup."
                : "No suggestion matched."
            }
            independent={backupCard ? independent(primary, backupCard.id) : false}
          />
          <Card
            kicker="Independent bank-payment rail"
            name={bank?.name ?? "GoCardless / Trustly / local bank"}
            slug={bank?.slug}
            score={bank?.scores.overall}
            note="Cards and bank debit fail for different reasons. That is the point."
            independent={bank ? independent(primary, bank.id) : true}
          />
          <Card
            kicker="Optional wallet"
            name={wallet?.name ?? "Wallet sidecar"}
            slug={wallet?.slug}
            score={wallet?.scores.overall}
            note="A wallet is a method, not a treasury. Do not park operating cash there."
            independent={wallet ? independent(primary, wallet.id) : true}
          />
          <Card
            kicker="Optional Merchant of Record"
            name={mor?.name ?? "MoR for tax-heavy geos only"}
            slug={mor?.slug}
            score={mor?.scores.overall}
            note="Use MoR where tax/VAT handling is the job, not as 100% of billing."
            independent={mor ? independent(primary, mor.id) : true}
          />
        </div>
      ) : null}

      {warnings.length ? (
        <section className="mt-8 rounded-md border border-risk-high/30 bg-risk-high-bg p-4">
          <h2 className="font-display text-xl text-risk-high">Same tree, two logos</h2>
          <ul className="mt-2 text-sm space-y-2 text-ink">
            {warnings.map((w) => (
              <li key={w.id}>{w.warning}</li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mt-8 text-sm text-ink-muted">No known infrastructure overlap among the suggested names. Still confirm on the live contracts.</p>
      )}

      <p className="mt-6 text-sm">
        <Link to="/how-cooked" className="text-accent hover:underline">
          Run the cooked check
        </Link>
        {" · "}
        <Link to="/methodology" className="text-accent hover:underline">
          Scoring rules
        </Link>
      </p>
    </div>
  );
}

function Card({
  kicker,
  name,
  slug,
  score,
  note,
  independent,
}: {
  kicker: string;
  name: string;
  slug?: string;
  score?: number;
  note: string;
  independent: boolean;
}) {
  const inner = (
    <>
      <p className="text-xs uppercase tracking-wide text-ink-subtle">{kicker}</p>
      <p className="mt-1 font-medium text-lg">{name}</p>
      {typeof score === "number" ? (
        <div className="mt-1">
          <ScoreNumber value={score} size="sm" />
        </div>
      ) : null}
      <p className="mt-2 text-sm text-ink-muted">{note}</p>
      <p className="mt-2 text-xs">{independent ? "Treated as independent on PRI’s overlap map." : "Not independent of the primary."}</p>
    </>
  );
  const cls = "rounded-lg border border-border bg-bg-elevated p-4 block";
  if (slug) {
    return (
      <Link to="/processor/$slug" params={{ slug }} className={cls}>
        {inner}
      </Link>
    );
  }
  return <div className={cls}>{inner}</div>;
}

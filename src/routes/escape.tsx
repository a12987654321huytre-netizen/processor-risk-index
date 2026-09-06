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

  const independentOf = (id?: string) => {
    if (!id) return true;
    return infraWarnings([primary, id]).length === 0;
  };

  const backupCard =
    matches.find(
      (m) =>
        independentOf(m.provider.id) &&
        !m.provider.isMoR &&
        m.provider.types.some((t) => t === "psp" || t === "direct-acquirer" || t === "payment-aggregator" || t === "merchant-account-provider"),
    )?.provider ?? matches.find((m) => independentOf(m.provider.id))?.provider;
  const bank = PROVIDERS.find((x) => x.types.includes("pay-by-bank") && x.id !== primary && independentOf(x.id));
  const wallet = PROVIDERS.find((x) => x.types.includes("wallet") && x.id !== primary && x.id !== backupCard?.id);
  const mor = PROVIDERS.find((x) => x.isMoR && x.id !== primary);

  const ids = [primary, backupCard?.id, bank?.id, wallet?.id, mor?.id].filter((x): x is string => Boolean(x));
  const warnings = infraWarnings(ids);

  const independent = (a?: string, b?: string) => {
    if (!a || !b) return true;
    return infraWarnings([a, b]).length === 0;
  };

  const token = p?.ohShit.paymentDataPortable ?? "Unknown";
  const subs = p?.ohShit.subscriptionsMigrate ?? "Unknown";
  const blast = p?.ohShit.blastRadius ?? "Unknown";

  return (
    <div className="page-wrap py-10">
      <p className="meta text-accent">The emergency exit</p>
      <h1 className="mt-2 font-display text-4xl">Build your escape hatch</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        If this processor vanished tomorrow, what would you do? Backup processor: cheaper than a nervous breakdown.
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
        <section className="mt-10 border-t border-border pt-6">
          <h2 className="receipt text-ink">Your current stack</h2>
          <dl className="mt-3 grid sm:grid-cols-2 gap-x-8">
            <Row k="Primary" v={p.name} />
            <Row k="Backup card" v={backupCard?.name ?? "None"} warn={!backupCard} />
            <Row k="Independent rail" v={bank?.name ?? "None"} warn={!bank} />
            <Row k="Subscriptions" v={subs} />
            <Row k="Token dependency" v={token} />
            <Row k="Blast radius" v={blast} />
          </dl>
        </section>
      ) : null}

      {p ? (
        <section className="mt-10 border-t border-border pt-6">
          <h2 className="receipt text-ink">Your escape hatch</h2>
          <ol className="mt-3 list-decimal pl-5 text-sm space-y-2 max-w-2xl">
            <li>
              Add backup card processor
              {backupCard ? (
                <>
                  :{" "}
                  <Link to="/processor/$slug" params={{ slug: backupCard.slug }} className="text-accent hover:underline">
                    {backupCard.name}
                  </Link>
                  {independent(primary, backupCard.id) ? "" : " — related infrastructure, pick another."}
                </>
              ) : null}
            </li>
            <li>
              Add independent payment rail
              {bank ? (
                <>
                  :{" "}
                  <Link to="/processor/$slug" params={{ slug: bank.slug }} className="text-accent hover:underline">
                    {bank.name}
                  </Link>
                </>
              ) : null}
            </li>
            <li>Verify subscription migration path — {subs}</li>
            <li>Document settlement exposure — {p.ohShit.fundsHeld}</li>
            <li>Test backup checkout while this {p.name} account is healthy</li>
          </ol>
          <p className="mt-4 font-mono text-[12px] text-ink-subtle">The worst time to build a fire escape is during the fire.</p>
        </section>
      ) : null}

      {p ? (
        <section className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm text-left">
            <thead>
              <tr className="border-b border-border receipt">
                <th className="py-2 pr-3 font-medium">Role</th>
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 pr-3 font-medium">Risk</th>
                <th className="py-2 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              <StackRow
                role="Primary"
                name={p.name}
                slug={p.slug}
                score={p.publishedOverall}
                note={p.isMoR ? "Merchant of Record. Cards here are not your MID." : p.acquiringModel}
              />
              <StackRow
                role="Backup card"
                name={backupCard?.name ?? "Add a second PSP"}
                slug={backupCard?.slug}
                score={backupCard?.publishedOverall}
                note={
                  backupCard
                    ? independent(primary, backupCard.id)
                      ? "Different family from the primary."
                      : "Related infrastructure — this is not a real backup."
                    : "No suggestion matched."
                }
              />
              <StackRow
                role="Independent rail"
                name={bank?.name ?? "Pay-by-bank / local bank"}
                slug={bank?.slug}
                score={bank?.publishedOverall}
                note="Cards and bank debit fail for different reasons. That is the point."
              />
              <StackRow
                role="Optional wallet"
                name={wallet?.name ?? "Wallet sidecar"}
                slug={wallet?.slug}
                score={wallet?.publishedOverall}
                note="A wallet is a method, not a treasury."
              />
              <StackRow
                role="Optional MoR"
                name={mor?.name ?? "MoR for tax-heavy geos only"}
                slug={mor?.slug}
                score={mor?.publishedOverall}
                note="Use MoR where tax handling is the job, not as 100% of billing."
              />
            </tbody>
          </table>
        </section>
      ) : null}

      {warnings.length ? (
        <section className="mt-8 border border-risk-high/30 bg-risk-high-bg p-4">
          <h2 className="font-sans text-lg font-medium text-risk-high">Same tree, two logos</h2>
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

function Row({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="border-b border-border py-2 flex items-baseline justify-between gap-4">
      <dt className="receipt">{k}</dt>
      <dd className={warn ? "text-sm text-risk-high" : "text-sm"}>{v}</dd>
    </div>
  );
}

function StackRow({
  role,
  name,
  slug,
  score,
  note,
}: {
  role: string;
  name: string;
  slug?: string;
  score?: number | null;
  note: string;
}) {
  return (
    <tr className="border-b border-border align-top">
      <td className="py-3 pr-3 receipt">{role}</td>
      <td className="py-3 pr-3">
        {slug ? (
          <Link to="/processor/$slug" params={{ slug }} className="font-medium hover:underline">
            {name}
          </Link>
        ) : (
          <span>{name}</span>
        )}
      </td>
      <td className="py-3 pr-3">
        <ScoreNumber value={score} size="sm" />
      </td>
      <td className="py-3 text-ink-muted">{note}</td>
    </tr>
  );
}

import { Link } from "@tanstack/react-router";
import type { Provider } from "@/data/types";
import { DIMENSION_META, flagLabel, typeLabel } from "@/data/scoring";
import { matchAlternatives, resolveAlternatives, sourcesFor } from "@/data";
import { BandBadge, ConfidenceBadge, FlagChip, Initials, ScoreBar, ScoreNumber } from "@/components/score";
import { EvidenceChip, FindingCard, SourceLink, sourceTypeLabel } from "@/components/evidence";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const FLAG_LABELS: { key: keyof Provider["badges"]; label: string }[] = [
  { key: "shutdown", label: "Account shutdown" },
  { key: "fundsHold", label: "Funds hold" },
  { key: "reserve", label: "Reserve" },
  { key: "kycReview", label: "KYC / review" },
  { key: "suddenGrowth", label: "Sudden-growth sensitivity" },
  { key: "highTicket", label: "High-ticket sensitivity" },
  { key: "chargeback", label: "Chargeback sensitivity" },
  { key: "digitalGoods", label: "Digital-goods sensitivity" },
  { key: "crossBorder", label: "Cross-border complexity" },
  { key: "appealFriction", label: "Appeal friction" },
  { key: "platformDependency", label: "Platform dependency" },
];

function yn(v: Provider["snapshot"]["holdsAllowed"]): string {
  if (v === true) return "Yes";
  if (v === false) return "No";
  if (v === "varies") return "Varies";
  return "Unknown";
}

export function ProcessorView({ provider: p }: { provider: Provider }) {
  const sources = sourcesFor(p);
  const alts = resolveAlternatives(p);
  const matched = matchAlternatives(p).slice(0, 5);

  return (
    <article className="page-wrap py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-accent font-medium">Processor dossier</p>
      <header className="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <Initials name={p.name} />
          <div>
            <h1 className="font-display text-4xl">{p.name}</h1>
            <p className="mt-1 text-sm text-ink-muted">{p.legalName}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.types.map((t) => (
                <Badge key={t}>{typeLabel(t)}</Badge>
              ))}
              {p.regions.slice(0, 4).map((r) => (
                <Badge key={r} tone="accent">
                  {r}
                </Badge>
              ))}
              {p.researchStatus !== "complete" ? <Badge>Research {p.researchStatus}</Badge> : null}
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-bg-elevated p-4 min-w-[220px]">
          <p className="text-xs uppercase tracking-wide text-ink-subtle">Lockout risk</p>
          <ScoreNumber value={p.scores.overall} size="lg" />
          <div className="mt-2">
            <BandBadge score={p.scores.overall} />
          </div>
          <p className="mt-2 text-sm text-ink-muted">{p.verdict.cheekyLine}</p>
          <div className="mt-3">
            <ConfidenceBadge value={p.confidence} />
          </div>
        </div>
      </header>

      <section className="mt-10">
        <h2 className="font-display text-2xl">The short version</h2>
        <p className="mt-3 max-w-3xl text-ink-muted">{p.verdict.short}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
          <div className="rounded-md border border-border bg-bg-elevated p-4">
            <dt className="text-ink-subtle">Best for</dt>
            <dd className="mt-1">{p.whoFor.bestFor}</dd>
          </div>
          <div className="rounded-md border border-border bg-bg-elevated p-4">
            <dt className="text-ink-subtle">Think twice if</dt>
            <dd className="mt-1">{p.whoFor.thinkTwiceIf}</dd>
          </div>
          <div className="rounded-md border border-border bg-bg-elevated p-4">
            <dt className="text-ink-subtle">Backup recommended</dt>
            <dd className="mt-1">{p.whoFor.backupRecommended ? "Yes" : "Still a good idea"}</dd>
          </div>
          <div className="rounded-md border border-border bg-bg-elevated p-4">
            <dt className="text-ink-subtle">Typical merchant</dt>
            <dd className="mt-1">{p.whoFor.typicalMerchant}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Risk breakdown</h2>
        <ul className="mt-4 grid gap-3">
          {DIMENSION_META.map((d) => (
            <li key={d.key} className="grid grid-cols-[1fr_auto] gap-3 items-center">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>
                    {d.label} <span className="text-ink-subtle">({d.weightPct}%)</span>
                  </span>
                  <span className="tabular">{p.dimensions[d.key].toFixed(1)} / 10</span>
                </div>
                <ScoreBar value={p.dimensions[d.key]} />
                <p className="mt-1 text-xs text-ink-subtle">{d.help}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Badges</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {FLAG_LABELS.map((f) => (
            <FlagChip key={f.key} label={f.label} level={p.badges[f.key]} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Snapshot</h2>
        <dl className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-md overflow-hidden text-sm">
          {[
            ["Holds allowed", yn(p.snapshot.holdsAllowed)],
            ["Reserves allowed", yn(p.snapshot.reservesAllowed)],
            ["Merchant of Record", p.isMoR ? "Yes" : "No"],
            ["Direct acquiring", yn(p.snapshot.directAcquiring)],
            ["Appeal available", yn(p.snapshot.appealAvailable)],
            ["Human support", yn(p.snapshot.humanSupport)],
            ["Aggregator", p.isAggregator ? "Yes" : "No"],
            ["Last verified", p.lastVerified],
            ["Headquarters", p.headquarters],
          ].map(([k, v]) => (
            <div key={k} className="bg-bg-elevated px-4 py-3">
              <dt className="text-ink-subtle text-xs">{k}</dt>
              <dd className="mt-1">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-ink-muted">{p.acquiringModel}</p>
        <p className="mt-2 text-sm text-ink-muted">
          Merchant countries (sourced): {p.merchantCountries.length ? p.merchantCountries.join(", ") : "Not published as a complete list"}. {p.merchantCountriesNote}
        </p>
        {p.infrastructureNotes.length > 0 ? (
          <ul className="mt-3 text-sm text-ink-muted list-disc pl-5">
            {p.infrastructureNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">What the contract says</h2>
        <p className="mt-2 text-sm text-ink-subtle">Paraphrases, not legal advice. Read the linked agreement.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {p.contract.map((f) => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">What merchants report</h2>
        <p className="mt-2 text-sm text-ink-muted">Anecdotes aren’t policy. Patterns are still useful.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {p.reportBuckets.map((b) => (
            <li key={b.key} className="rounded-md border border-border bg-bg-elevated p-4">
              <p className="text-sm font-medium">{b.label}</p>
              <p className="tabular text-2xl font-display mt-1">{b.count === null ? "—" : b.count}</p>
              <p className="text-xs text-ink-subtle mt-2">{b.note}</p>
            </li>
          ))}
        </ul>
        {p.incidents.length > 0 ? (
          <ul className="mt-4 grid gap-3">
            {p.incidents.map((inc) => (
              <li key={inc.id} className="rounded-md border border-border p-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <EvidenceChip label={inc.label} />
                  <span className="text-xs text-ink-subtle">{inc.date ?? "Date unknown"}</span>
                </div>
                <p className="mt-2 text-sm">{inc.summary}</p>
                <p className="mt-1 text-xs text-ink-subtle">
                  Outcome: {inc.outcome.replace(/-/g, " ")} · Merchant responsibility: {inc.merchantResponsibility}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-subtle">Not enough merchant reports in the structured incident table to establish a pattern. See sources.</p>
        )}
        <p className="mt-3 text-xs text-ink-subtle">{p.complaintVolumeNote}</p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">When things went right</h2>
        {p.positiveOutcomes.length ? (
          <ul className="mt-3 grid gap-2">
            {p.positiveOutcomes.map((o) => (
              <li key={o.id} className="rounded-md border border-border bg-bg-elevated p-4 text-sm">
                {o.summary}
                {o.date ? <span className="block text-xs text-ink-subtle mt-1">{o.date}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-subtle">No structured positive-outcome write-up on file yet.</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">What tends to trigger scrutiny?</h2>
        <ul className="mt-3 grid gap-2">
          {p.triggers.map((t) => (
            <li key={t.id} className="flex flex-col sm:flex-row sm:items-baseline gap-2 rounded-md border border-border p-3 text-sm">
              <span>{t.text}</span>
              <span className="text-xs text-ink-subtle sm:ml-auto">{t.evidence.replace(/-/g, " ")}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-lg border border-border-strong bg-surface p-5">
        <h2 className="font-display text-2xl">If they shut you down tomorrow</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Blast radius: <strong>{p.ohShit.blastRadius}</strong>. This is architecture, not a prediction.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-ink-subtle">Can payments continue?</dt>
            <dd>{p.ohShit.paymentsContinue}</dd>
          </div>
          <div>
            <dt className="text-ink-subtle">Subscriptions</dt>
            <dd>{p.ohShit.subscriptionsMigrate}</dd>
          </div>
          <div>
            <dt className="text-ink-subtle">Payment data portable?</dt>
            <dd>{p.ohShit.paymentDataPortable}</dd>
          </div>
          <div>
            <dt className="text-ink-subtle">Funds potentially held</dt>
            <dd>{p.ohShit.fundsHeld}</dd>
          </div>
          <div>
            <dt className="text-ink-subtle">Migration difficulty</dt>
            <dd>{p.ohShit.migrationDifficulty}</dd>
          </div>
          <div>
            <dt className="text-ink-subtle">Emergency alternative</dt>
            <dd>{p.ohShit.emergencyAlternative}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-ink-subtle">Long-term alternative</dt>
            <dd>{p.ohShit.longTermAlternative}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Alternatives</h2>
        <p className="mt-2 text-sm text-ink-muted">Do not treat a related logo as a second processor. Matching weights country, model, features, dependency, risk delta and confidence.</p>
        {alts.length ? (
          <ul className="mt-3 grid gap-2">
            {alts.map((a) => (
              <li key={a.providerId + a.kind}>
                <Link
                  to="/processor/$slug"
                  params={{ slug: a.provider.slug }}
                  className="block rounded-md border border-border bg-bg-elevated p-4 hover:border-border-strong"
                >
                  <span className="text-xs uppercase tracking-wide text-ink-subtle">{a.kind.replace(/-/g, " ")}</span>
                  <span className="block font-medium">{a.provider.name}</span>
                  <span className="text-sm text-ink-muted">{a.why}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        <h3 className="mt-6 font-medium text-sm">Matching engine (same country-agnostic pass)</h3>
        <ul className="mt-2 grid gap-2">
          {matched.map((m) => (
            <li key={m.provider.id} className="rounded-md border border-border p-3 text-sm">
              <Link to="/processor/$slug" params={{ slug: m.provider.slug }} className="font-medium">
                {m.provider.name}
              </Link>
              <span className="tabular text-ink-subtle"> · match {(m.total * 100).toFixed(0)} · risk {m.provider.scores.overall}</span>
              <p className="text-ink-muted mt-1">{m.why[0]}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3">
          <Button variant="secondary" asChild>
            <Link to="/compare">Compare with others</Link>
          </Button>
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Keep your account boring</h2>
        <ul className="mt-3 grid gap-2 text-sm list-disc pl-5 text-ink-muted">
          {p.riskReduction.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Sources</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-subtle border-b border-border">
                <th className="py-2 pr-3">Source</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2">Jurisdiction</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.id} className="border-b border-border">
                  <td className="py-2 pr-3">
                    <SourceLink source={s} />
                    <p className="text-xs text-ink-subtle mt-1">{s.notes}</p>
                  </td>
                  <td className="py-2 pr-3">{sourceTypeLabel(s.sourceType)}</td>
                  <td className="py-2 pr-3 tabular">{s.publicationDate ?? "—"}</td>
                  <td className="py-2">{s.jurisdiction ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-ink-muted">
          Last updated {p.lastVerified}.{" "}
          <Link to="/corrections" className="text-accent hover:underline">
            Submit a correction
          </Link>
        </p>
      </section>
    </article>
  );
}

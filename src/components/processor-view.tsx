import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { DimensionScores, Provider } from "@/data/types";
import { DIMENSION_META, flagLabel, typeLabel } from "@/data/scoring";
import { alternativeGroups, infraFor, sourcesFor } from "@/data";
import { researchStatusHint, researchStatusLabel, typeContextNote } from "@/data/eligibility";
import { formatDimension } from "@/data/rubric";
import { BandBadge, ConfidenceBadge, FlagChip, Initials, ScoreBar, ScoreNumber } from "@/components/score";
import { EvidenceChip, FindingCard, SourceLink, sourceTypeLabel } from "@/components/evidence";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COMMERCIAL_FIREWALL } from "@/lib/commercial";
import { LAST_RECALCULATED } from "@/lib/site";

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

function supportAccessLabel(v: Provider["snapshot"]["supportAccess"]): string {
  switch (v) {
    case "24-7-phone-chat-email":
      return "24/7 phone, chat and email";
    case "phone-available":
      return "Phone available";
    case "chat-email":
      return "Chat / email";
    case "ticket-only":
      return "Ticket only";
    case "account-manager-qualifying":
      return "Account manager for qualifying merchants";
    case "varies-by-plan":
      return "Varies by plan / merchant tier";
    default:
      return "Unknown";
  }
}

function escalationLabel(v: Provider["snapshot"]["escalationQuality"]): string {
  switch (v) {
    case "good":
      return "Good";
    case "mixed":
      return "Mixed";
    case "poor":
      return "Poor";
    default:
      return "Insufficient evidence";
  }
}

function scoreAnnotation(n: number | null): string | null {
  if (n === null) return null;
  if (n >= 60) return "yeah, we’d have a backup";
  if (n <= 30) return "relatively boring. That’s a compliment.";
  return null;
}

export function ProcessorView({ provider: p }: { provider: Provider }) {
  const sources = sourcesFor(p);
  const groups = alternativeGroups(p);
  const family = infraFor(p.id);
  const [openDim, setOpenDim] = useState<keyof DimensionScores | null>(null);
  const drawer = openDim ? p.dimensionExplanations.find((d) => d.key === openDim) : null;
  const depth = p.researchDepth;
  const conf = p.confidenceBreakdown;

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
                <Badge key={t} title={typeContextNote()}>
                  {typeLabel(t)}
                </Badge>
              ))}
              {p.regions.slice(0, 4).map((r) => (
                <Badge key={r} tone="accent">
                  {r}
                </Badge>
              ))}
              <Badge>#{p.rank} of 50</Badge>
              <Badge title={researchStatusHint(p.researchStatus)}>{researchStatusLabel(p.researchStatus)}</Badge>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-bg-elevated p-4 min-w-[220px]">
          <p className="text-xs uppercase tracking-wide text-ink-subtle">Provider risk</p>
          <ScoreNumber value={p.publishedOverall} size="lg" />
          {scoreAnnotation(p.publishedOverall) ? (
            <p className="mt-1 font-mono text-[11px] text-ink-subtle">{scoreAnnotation(p.publishedOverall)}</p>
          ) : null}
          <div className="mt-2">
            <BandBadge score={p.publishedOverall} />
          </div>
          {p.rankDelta ? (
            <p className="mt-2 text-xs text-ink-subtle">
              {p.rankDelta > 0 ? `↑ ${p.rankDelta} places since last review` : `↓ ${Math.abs(p.rankDelta)} places since last review`}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-ink-muted">{p.verdict.cheekyLine}</p>
          <div className="mt-3">
            <ConfidenceBadge value={p.confidence} />
          </div>
          <p className="mt-2 text-[11px] text-ink-subtle" title={researchStatusHint(p.researchStatus)}>
            {researchStatusLabel(p.researchStatus)} is evidence quality, not permission to exist on the index.
          </p>
        </div>
      </header>

      {p.structuralNote ? (
        <p className="mt-6 rounded-md border border-border bg-surface p-4 text-sm text-ink-muted">{p.structuralNote}</p>
      ) : null}

      <section className="mt-8 rounded-md border border-border bg-bg-elevated p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-medium text-sm">Research depth</h2>
          <span className="text-xs uppercase tracking-wide text-ink-subtle">{depth.band} · next to evidence confidence</span>
        </div>
        <dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
          {[
            ["Official sources", depth.officialSources],
            ["Independent reports", depth.independentReports],
            ["Jurisdictions checked", depth.jurisdictions],
            ["Incidents logged", depth.incidents],
            ["Successful resolutions", depth.successfulResolutions],
            ["Last verified", depth.lastVerified],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-ink-subtle">{k}</dt>
              <dd className="tabular mt-0.5">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-ink-subtle">
          Confidence {conf.total}/100 = official {conf.official}/35 · independent {conf.independent}/25 · recency {conf.recency}/15 ·
          jurisdiction {conf.jurisdiction}/10 · diversity {conf.diversity}/10 · contradiction {conf.contradiction}/5.
          {p.officialCoverage.missing.length ? ` Missing official coverage: ${p.officialCoverage.missing.join(", ")}.` : ""}{" "}
          Index last recalculated {LAST_RECALCULATED}.
        </p>
      </section>

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
        <p className="mt-2 text-sm text-ink-subtle">Click a dimension. The number should have receipts.</p>
        <ul className="mt-4 grid gap-3">
          {DIMENSION_META.map((d) => {
            const shown = formatDimension(p.dimensions[d.key]);
            return (
              <li key={d.key}>
                <button
                  type="button"
                  onClick={() => setOpenDim(openDim === d.key ? null : d.key)}
                  className="w-full text-left grid grid-cols-[1fr_auto] gap-3 items-center rounded-md px-1 py-1 hover:bg-surface"
                >
                  <div className="min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span>
                        {d.label} <span className="text-ink-subtle">({d.weightPct}%)</span>
                      </span>
                      <span className="tabular">{shown.precise ? shown.text : shown.text}</span>
                    </div>
                    <ScoreBar value={p.dimensions[d.key]} />
                    <p className="mt-1 text-xs text-ink-subtle">{d.help}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
        {drawer ? (
          <div className="mt-4 rounded-lg border border-border-strong bg-bg-elevated p-5">
            <p className="text-xs uppercase tracking-wide text-ink-subtle">Why {formatDimension(drawer.score).text}?</p>
            <h3 className="mt-1 font-display text-xl">{DIMENSION_META.find((d) => d.key === drawer.key)?.label}</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Rubric {drawer.bandLabel}: {drawer.bandText}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-subtle">Official evidence</p>
                {drawer.official.length ? (
                  <ul className="mt-2 space-y-2 text-sm">
                    {drawer.official.map((o) => (
                      <li key={o.sourceId + o.title}>
                        <SourceLink id={o.sourceId} />
                        <p className="text-ink-muted">{o.finding}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-ink-subtle">No official finding tagged to this dimension yet.</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-subtle">Merchant evidence</p>
                {drawer.merchant.length ? (
                  <ul className="mt-2 space-y-2 text-sm">
                    {drawer.merchant.map((m) => (
                      <li key={m.incidentId} className="text-ink-muted">
                        {m.summary}{" "}
                        <span className="text-xs text-ink-subtle">({m.outcome.replace(/-/g, " ")})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-ink-subtle">No structured incident mapped here. That lowers confidence, not the contractual score.</p>
                )}
              </div>
            </div>
            {drawer.counter.length ? (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-ink-subtle">Counter-evidence</p>
                <ul className="mt-2 list-disc pl-5 text-sm text-ink-muted space-y-1">
                  {drawer.counter.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-ink-subtle">Rubric calculation</p>
              <ul className="mt-2 grid sm:grid-cols-2 gap-1 text-sm">
                {drawer.parts.map((part) => (
                  <li key={part.id} className="flex justify-between gap-3">
                    <span className="text-ink-muted">{part.label}</span>
                    <span className="tabular">{part.score}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm">
                Calculated score: <span className="tabular font-medium">{drawer.calculated.toFixed(1)}</span>
              </p>
            </div>
          </div>
        ) : null}
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
            ["Support access", supportAccessLabel(p.snapshot.supportAccess)],
            ["Escalation quality", escalationLabel(p.snapshot.escalationQuality)],
            ["Aggregator", p.isAggregator ? "Yes" : "No"],
            ["Last verified", p.lastVerified],
            ["Headquarters", p.headquarters],
            ["Business type", p.whoFor.typicalMerchant],
            ["Provider type", p.types.map((t) => typeLabel(t)).join(" · ")],
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
        {p.types.includes("gateway") ? (
          <p className="mt-3 text-sm text-ink-muted">{typeContextNote()}</p>
        ) : null}
        {p.infrastructureNotes.length > 0 ? (
          <ul className="mt-3 text-sm text-ink-muted list-disc pl-5">
            {p.infrastructureNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        ) : null}
      </section>

      {family.length ? (
        <section className="mt-10">
          <h2 className="font-display text-2xl">Family tree</h2>
          <p className="mt-2 text-sm text-ink-muted">Ownership is not automatically the same acquiring file. We only warn where the relationship is documented.</p>
          <ul className="mt-3 grid gap-2">
            {family.map((g) => (
              <li key={g.id} className="rounded-md border border-border bg-surface p-4 text-sm">
                <p className="font-mono text-[11px] text-ink-subtle">
                  {g.kind === "ownership" ? "same parent company" : g.kind === "processing" ? "processing dependency" : g.kind === "acquiring" ? "acquiring dependency" : "relationship unclear"}
                </p>
                <p className="mt-1 font-medium">{g.label}</p>
                <p className="mt-1 text-ink-muted">{g.warning}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-2xl">What the contract says</h2>
        <p className="mt-2 text-sm text-ink-subtle">Paraphrases, not legal advice. Read the linked agreement. We’ll make the joke. Then we’ll show you the contract clause.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {p.contract.map((f) => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">What merchants report</h2>
        <p className="mt-2 text-sm text-ink-muted">The contract says one thing. Merchants have opinions. Here are both. Ten comments in one thread still count as one incident.</p>
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
                  <span className="text-xs text-ink-subtle">Strength: {inc.evidenceStrength}</span>
                  {inc.country ? <span className="text-xs text-ink-subtle">{inc.country}</span> : null}
                </div>
                <p className="mt-2 text-sm">{inc.summary}</p>
                <p className="mt-1 text-xs text-ink-subtle">
                  Outcome: {inc.outcome.replace(/-/g, " ")} · Merchant responsibility: {inc.merchantResponsibility}
                  {inc.trigger ? ` · Trigger: ${inc.trigger}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-subtle">Not enough merchant reports in the structured incident table to establish a pattern. See sources. We do not invent five incidents to look thorough.</p>
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
          Blast radius: <strong>{p.ohShit.blastRadius}</strong>. This is architecture, not a prediction. The worst time to build a fire escape is during the fire.
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
        <p className="mt-4">
          <Button asChild>
            <Link to="/escape">Build the escape hatch</Link>
          </Button>
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">What should sit beside it</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Recommendations are grouped by intent. A close substitute is not a lower-risk escape. {COMMERCIAL_FIREWALL}
        </p>
        {groups.map((g) => (
          <div key={g.kind} className="mt-5">
            <h3 className="font-medium text-sm">{g.heading}</h3>
            <ul className="mt-2 grid gap-2">
              {g.items.map((a) => (
                <li key={a.providerId + a.kind}>
                  <Link
                    to="/processor/$slug"
                    params={{ slug: a.provider.slug }}
                    className="block rounded-md border border-border bg-bg-elevated p-4 hover:border-border-strong"
                  >
                    <span className="flex flex-wrap items-baseline gap-2">
                      <span className="font-medium">{a.provider.name}</span>
                      <span className="tabular text-xs text-ink-subtle">#{a.provider.rank} · {a.provider.publishedOverall}/100</span>
                      {typeof a.riskDelta === "number" && a.riskDelta <= -8 ? (
                        <span className="font-mono text-[11px] text-accent">↓ {Math.abs(Math.round(a.riskDelta))} risk points</span>
                      ) : null}
                    </span>
                    {a.annotation ? <span className="block font-mono text-[11px] text-ink-subtle mt-1">{a.annotation}</span> : null}
                    <span className="text-sm text-ink-muted mt-1 block">{a.headline || a.why}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="mt-4">
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

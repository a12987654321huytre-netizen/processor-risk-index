import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { DimensionScores, Provider } from "@/data/types";
import { DIMENSION_META, typeLabel, riskAnnotation, dependencyAnnotation } from "@/data/scoring";
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
  return riskAnnotation(n);
}

function formatReceiptDate(s: string): string {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
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
        <div className="border border-border bg-bg-elevated p-4 min-w-[220px]">
          <p className="receipt">Risk index</p>
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
        <p className="mt-6 border-l-2 border-border-strong pl-4 text-sm text-ink-muted">{p.structuralNote}</p>
      ) : null}

      <section className="mt-8 border-y border-border py-4">
        <p className="receipt mb-3">The homework</p>
        <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            ["Sources", String(sources.length)],
            ["Incidents", String(depth.incidents)],
            ["Jurisdictions", String(depth.jurisdictions)],
            ["Last checked", formatReceiptDate(depth.lastVerified)],
            ["Confidence", `${conf.total} / ${conf.total >= 70 ? "High" : conf.total >= 50 ? "Med" : "Low"}`],
            ["Rank", `#${p.rank} of 50`],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="receipt">{k}</dt>
              <dd className="tabular text-sm mt-0.5">{v}</dd>
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
        <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 text-sm border-t border-border pt-4">
          <div>
            <dt className="receipt">Best for</dt>
            <dd className="mt-1">{p.whoFor.bestFor}</dd>
          </div>
          <div>
            <dt className="receipt">Think twice if</dt>
            <dd className="mt-1">{p.whoFor.thinkTwiceIf}</dd>
          </div>
          <div>
            <dt className="receipt">Backup recommended</dt>
            <dd className="mt-1">{p.whoFor.backupRecommended ? "Yes" : "Still a good idea"}</dd>
          </div>
          <div>
            <dt className="receipt">Typical merchant</dt>
            <dd className="mt-1">{p.whoFor.typicalMerchant}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Risk breakdown</h2>
        <p className="mt-2 text-sm text-ink-subtle">One annotation per section. The rest is receipts.</p>
        <ul className="mt-4 grid gap-1">
          {DIMENSION_META.map((d) => {
            const shown = formatDimension(p.dimensions[d.key]);
            const open = openDim === d.key;
            const depNote = d.key === "dependency" ? dependencyAnnotation(p.dimensions.dependency) : null;
            return (
              <li key={d.key} className="border-b border-border">
                <button
                  type="button"
                  onClick={() => setOpenDim(open ? null : d.key)}
                  className="w-full text-left grid grid-cols-[1fr_auto] gap-3 items-center py-3 hover:bg-surface"
                  aria-expanded={open}
                >
                  <div className="min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span>
                        {d.label} <span className="text-ink-subtle">({d.weightPct}%)</span>
                      </span>
                      <span className="tabular">{shown.text}</span>
                    </div>
                    <ScoreBar value={p.dimensions[d.key]} />
                    {depNote ? <p className="mt-1 font-mono text-[11px] text-ink-subtle">{depNote}</p> : null}
                  </div>
                  <span className="receipt shrink-0">{open ? "Hide receipts" : "Show me the receipts"}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {drawer ? (
          <div className="mt-4 border border-border bg-bg-elevated p-4">
            <p className="receipt">Why {formatDimension(drawer.score).text}?</p>
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
              <li key={g.id} className="border-t border-border py-3 text-sm">
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
        <p className="mt-2 text-sm text-ink-subtle">The contract says one thing. Merchants have opinions. Here are both. Paraphrases, not legal advice.</p>
        <div className="mt-2">
          {p.contract.map((f) => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">What merchants report</h2>
        <p className="mt-2 text-sm text-ink-muted">The contract says one thing. Merchants have opinions. Here are both. Ten comments in one thread still count as one incident.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3 border-t border-border pt-4">
          {p.reportBuckets.map((b) => (
            <li key={b.key}>
              <p className="receipt">{b.label}</p>
              <p className="tabular text-2xl mt-1">{b.count === null ? "—" : b.count}</p>
              <p className="text-xs text-ink-subtle mt-2">{b.note}</p>
            </li>
          ))}
        </ul>
        {p.incidents.length > 0 ? (
          <ul className="mt-4 grid gap-3">
            {p.incidents.map((inc) => (
              <li key={inc.id} className="border-t border-border py-4">
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
              <li key={o.id} className="border-t border-border py-3 text-sm">
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
        <h2 className="font-display text-2xl">What seems to trigger scrutiny</h2>
        <ul className="mt-3 grid gap-2">
          {p.triggers.map((t) => (
            <li key={t.id} className="flex flex-col sm:flex-row sm:items-baseline gap-2 border-t border-border py-3 text-sm">
              <span>{t.text}</span>
              <span className="text-xs text-ink-subtle sm:ml-auto">{t.evidence.replace(/-/g, " ")}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 border border-border bg-surface p-5">
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
        <h2 className="font-display text-2xl">So where the hell do I go instead?</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Recommendations are grouped by intent. A close substitute is not a lower-risk escape. {COMMERCIAL_FIREWALL}
        </p>
        {groups.map((g) => (
          <div key={g.kind} className="mt-6">
            <h3 className="receipt text-ink">{g.heading}</h3>
            <ul className="mt-2 divide-y divide-border border-t border-border">
              {g.items.map((a, i) => {
                const delta = typeof a.riskDelta === "number" ? Math.round(a.riskDelta) : null;
                const safer = delta !== null && delta <= -8;
                const punchline = g.kind === "lower-risk-escape" && i === 0 && safer;
                return (
                  <li key={a.providerId + a.kind}>
                    <Link
                      to="/processor/$slug"
                      params={{ slug: a.provider.slug }}
                      className="block py-4 hover:bg-surface"
                    >
                      <span className="flex flex-wrap items-baseline gap-2">
                        <span className="font-medium">{a.provider.name}</span>
                        <span className="tabular text-xs text-ink-subtle">
                          #{a.provider.rank} · {p.publishedOverall}
                          {safer ? " → " : " · "}
                          {safer ? a.provider.publishedOverall : `${a.provider.publishedOverall}/100`}
                        </span>
                        {safer ? (
                          <span className="receipt text-accent">{delta} risk points</span>
                        ) : null}
                        {a.tag === "same-problem" ? (
                          <span className="receipt text-risk-high">Same problem, different logo</span>
                        ) : null}
                        {a.tag === "independent" ? (
                          <span className="receipt text-accent">Actually independent</span>
                        ) : null}
                      </span>
                      {punchline ? (
                        <span className="block font-mono text-[11px] text-ink-subtle mt-1">Now we're actually getting somewhere.</span>
                      ) : null}
                      {a.annotation && a.tag !== "same-problem" && a.tag !== "independent" ? (
                        <span className="block font-mono text-[11px] text-ink-subtle mt-1">{a.annotation}</span>
                      ) : a.tag === "same-problem" ? (
                        <span className="block text-sm text-ink-muted mt-1">
                          This may work as a replacement, but it doesn't significantly reduce the risk category you're trying to escape.
                        </span>
                      ) : null}
                      <span className="text-sm text-ink-muted mt-1 block">{a.headline || a.why}</span>
                    </Link>
                  </li>
                );
              })}
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

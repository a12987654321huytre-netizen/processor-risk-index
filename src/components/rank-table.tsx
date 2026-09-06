import { Link } from "@tanstack/react-router";
import type { Provider } from "@/data/types";
import { bandFor, confidenceShort, flagLabel, typeLabel } from "@/data/scoring";
import { researchStatusHint, researchStatusLabel } from "@/data/eligibility";
import { Initials, ScoreNumber, bandClass, ConfidenceBadge } from "@/components/score";
import { cn } from "@/lib/utils";

const TIE_HINT = "Displayed scores are rounded. Ranking uses the underlying score before rounding.";

function ShortBand({ score }: { score: number }) {
  const band = bandFor(score);
  if (!band) return null;
  const bg: Record<string, string> = {
    low: "bg-risk-low-bg text-risk-low",
    guarded: "bg-risk-guarded-bg text-risk-guarded",
    moderate: "bg-risk-moderate-bg text-risk-moderate",
    elevated: "bg-risk-elevated-bg text-risk-elevated",
    high: "bg-risk-high-bg text-risk-high",
    severe: "bg-risk-severe-bg text-risk-severe",
    "very-high": "bg-risk-very-high-bg text-risk-very-high",
    extreme: "bg-risk-extreme-bg text-risk-extreme",
  };
  return <span className={cn("inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-medium", bg[band.id])}>{band.label}</span>;
}

function RankDelta({ p }: { p: Provider }) {
  if (p.rankDelta === null || p.rankDelta === 0) return null;
  const up = p.rankDelta > 0;
  return (
    <span
      className={cn("ml-1 font-mono text-[10px]", up ? "text-risk-high" : "text-ink-subtle")}
      title={up ? `Up ${p.rankDelta} places since last review` : `Down ${Math.abs(p.rankDelta)} places since last review`}
    >
      {up ? `↑${p.rankDelta}` : `↓${Math.abs(p.rankDelta)}`}
    </span>
  );
}

function ConfidenceCell({ p }: { p: Provider }) {
  const c = confidenceShort(p.confidence);
  const title =
    c.tone === "low"
      ? "This ranking is based on incomplete evidence and may change materially as additional research is added."
      : researchStatusHint(p.researchStatus);
  const tone =
    c.tone === "high" ? "text-risk-low" : c.tone === "medium" ? "text-risk-moderate" : "text-risk-high";
  return (
    <span className="tabular" title={title}>
      <span className="font-medium">{p.confidence}</span>
      <span className={cn("ml-1 text-[10px] uppercase tracking-wide", tone)}>{c.label}</span>
    </span>
  );
}

export function RankTable({
  rows,
  compact,
}: {
  rows: Provider[];
  compact?: boolean;
}) {
  const tiedScores = new Set(
    rows.filter((p) => rows.some((x) => x.id !== p.id && x.publishedOverall === p.publishedOverall)).map((p) => p.publishedOverall),
  );
  return (
    <div className="overflow-x-auto border border-border bg-bg-elevated">
      <table className="w-full min-w-[760px] text-sm text-left">
        <thead>
          <tr className="border-b border-border text-[10px] uppercase tracking-[0.12em] text-ink-subtle font-mono">
            <th className="px-2.5 py-2 font-medium w-12">Rank</th>
            <th className="px-2.5 py-2 font-medium">Provider</th>
            <th className="px-2.5 py-2 font-medium">Risk</th>
            <th className="px-2.5 py-2 font-medium">Confidence</th>
            <th className="px-2.5 py-2 font-medium">Status</th>
            {!compact ? <th className="px-2.5 py-2 font-medium">Shutdown</th> : null}
            {!compact ? <th className="px-2.5 py-2 font-medium">Funds hold</th> : null}
            <th className="px-2.5 py-2 font-medium">Type</th>
            {!compact ? <th className="px-2.5 py-2 font-medium">Sources</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface/60">
              <td className="px-2.5 py-2 tabular text-ink-subtle">
                #{p.rank}
                <RankDelta p={p} />
              </td>
              <td className="px-2.5 py-2">
                <Link to="/processor/$slug" params={{ slug: p.slug }} className="flex items-center gap-2 min-h-10">
                  <Initials name={p.name} />
                  <span className="font-medium font-sans">{p.name}</span>
                </Link>
              </td>
              <td className="px-2.5 py-2" title={tiedScores.has(p.publishedOverall) ? TIE_HINT : undefined}>
                <div className="flex items-center gap-2">
                  <span className={cn("tabular font-medium", bandClass(bandFor(p.publishedOverall)?.id))}>
                    {p.publishedOverall}
                  </span>
                  <ShortBand score={p.publishedOverall} />
                </div>
              </td>
              <td className="px-2.5 py-2">
                <ConfidenceCell p={p} />
              </td>
              <td className="px-2.5 py-2 text-ink-subtle text-[11px]" title={researchStatusHint(p.researchStatus)}>
                {researchStatusLabel(p.researchStatus)}
              </td>
              {!compact ? <td className="px-2.5 py-2 text-ink-muted text-[13px]">{flagLabel(p.badges.shutdown)}</td> : null}
              {!compact ? <td className="px-2.5 py-2 text-ink-muted text-[13px]">{flagLabel(p.badges.fundsHold)}</td> : null}
              <td className="px-2.5 py-2 text-ink-muted text-[13px]">{typeLabel(p.types[0] ?? "")}</td>
              {!compact ? <td className="px-2.5 py-2 tabular text-ink-subtle">{p.sourceIds.length}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RankCards({ rows }: { rows: Provider[] }) {
  const tiedScores = new Set(
    rows.filter((p) => rows.some((x) => x.id !== p.id && x.publishedOverall === p.publishedOverall)).map((p) => p.publishedOverall),
  );
  return (
    <ul className="divide-y divide-border border border-border bg-bg-elevated md:hidden">
      {rows.map((p) => (
        <li key={p.id}>
          <Link to="/processor/$slug" params={{ slug: p.slug }} className="flex items-center gap-3 px-3 py-2.5 min-h-12">
            <span className="tabular text-xs text-ink-subtle w-7">#{p.rank}</span>
            <Initials name={p.name} />
            <span className="flex-1 min-w-0">
              <span className="block font-medium truncate">{p.name}</span>
              <span className="text-[11px] text-ink-subtle">
                {typeLabel(p.types[0] ?? "")} · {p.sourceIds.length} src
              </span>
            </span>
            <span className="text-right shrink-0" title={tiedScores.has(p.publishedOverall) ? TIE_HINT : undefined}>
              <ScoreNumber value={p.publishedOverall} size="sm" />
              <span className="block">
                <ConfidenceBadge value={p.confidence} />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

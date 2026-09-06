import { Link } from "@tanstack/react-router";
import type { Provider } from "@/data/types";
import { bandFor, confidenceShort, flagLabel, typeLabel } from "@/data/scoring";
import { researchStatusHint, researchStatusLabel } from "@/data/eligibility";
import { Initials, ScoreNumber, bandClass, ConfidenceBadge } from "@/components/score";
import { cn } from "@/lib/utils";

function ShortBand({ score }: { score: number }) {
  const band = bandFor(score);
  if (!band) return null;
  const bg: Record<string, string> = {
    low: "bg-risk-low-bg text-risk-low",
    guarded: "bg-risk-guarded-bg text-risk-guarded",
    moderate: "bg-risk-moderate-bg text-risk-moderate",
    high: "bg-risk-high-bg text-risk-high",
    "very-high": "bg-risk-very-high-bg text-risk-very-high",
    extreme: "bg-risk-extreme-bg text-risk-extreme",
  };
  return <span className={cn("inline-flex rounded-sm px-1.5 py-0.5 text-[11px] font-medium", bg[band.id])}>{band.label}</span>;
}

function RankDelta({ p }: { p: Provider }) {
  if (p.rankDelta === null || p.rankDelta === 0) return null;
  const up = p.rankDelta > 0;
  return (
    <span
      className={cn("ml-1 text-[10px]", up ? "text-risk-high" : "text-ink-subtle")}
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
      <span className={cn("ml-1 text-[11px] uppercase tracking-wide font-medium", tone)}>{c.label}</span>
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
  return (
    <div className="overflow-x-auto hairline rounded-lg bg-bg-elevated">
      <table className="w-full min-w-[720px] text-sm text-left">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-ink-subtle">
            <th className="px-3 py-3 font-medium w-12">Rank</th>
            <th className="px-3 py-3 font-medium">Provider</th>
            <th className="px-3 py-3 font-medium">Risk index</th>
            <th className="px-3 py-3 font-medium">Evidence confidence</th>
            <th className="px-3 py-3 font-medium">Status</th>
            {!compact ? <th className="px-3 py-3 font-medium">Shutdown</th> : null}
            {!compact ? <th className="px-3 py-3 font-medium">Funds hold</th> : null}
            <th className="px-3 py-3 font-medium">Type</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface/60">
              <td className="px-3 py-2.5 tabular text-ink-subtle">
                {p.rank}
                <RankDelta p={p} />
              </td>
              <td className="px-3 py-2.5">
                <Link to="/processor/$slug" params={{ slug: p.slug }} className="flex items-center gap-2 min-h-11">
                  <Initials name={p.name} />
                  <span className="font-medium">{p.name}</span>
                </Link>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={cn("tabular font-medium", bandClass(bandFor(p.publishedOverall)?.id))}>
                    {p.publishedOverall}
                  </span>
                  <ShortBand score={p.publishedOverall} />
                </div>
              </td>
              <td className="px-3 py-2.5">
                <ConfidenceCell p={p} />
              </td>
              <td className="px-3 py-2.5 text-ink-muted text-xs" title={researchStatusHint(p.researchStatus)}>
                {researchStatusLabel(p.researchStatus)}
              </td>
              {!compact ? <td className="px-3 py-2.5 text-ink-muted">{flagLabel(p.badges.shutdown)}</td> : null}
              {!compact ? <td className="px-3 py-2.5 text-ink-muted">{flagLabel(p.badges.fundsHold)}</td> : null}
              <td className="px-3 py-2.5 text-ink-muted">{typeLabel(p.types[0] ?? "")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RankCards({ rows }: { rows: Provider[] }) {
  return (
    <ul className="divide-y divide-border hairline rounded-lg bg-bg-elevated md:hidden">
      {rows.map((p) => (
        <li key={p.id}>
          <Link to="/processor/$slug" params={{ slug: p.slug }} className="flex items-center gap-3 px-3 py-3 min-h-14">
            <span className="tabular text-xs text-ink-subtle w-6">{p.rank}</span>
            <Initials name={p.name} />
            <span className="flex-1">
              <span className="block font-medium">{p.name}</span>
              <span className="text-xs text-ink-subtle">
                {typeLabel(p.types[0] ?? "")} · {researchStatusLabel(p.researchStatus)}
              </span>
            </span>
            <span className="text-right">
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

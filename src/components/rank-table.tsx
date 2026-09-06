import { Link } from "@tanstack/react-router";
import type { Provider } from "@/data/types";
import { bandFor, flagLabel, typeLabel } from "@/data/scoring";
import { Initials, ScoreNumber, bandClass } from "@/components/score";
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
            <th className="px-3 py-3 font-medium w-12">#</th>
            <th className="px-3 py-3 font-medium">Processor</th>
            <th className="px-3 py-3 font-medium">Risk index</th>
            {!compact ? <th className="px-3 py-3 font-medium">Hold</th> : null}
            {!compact ? <th className="px-3 py-3 font-medium">Shutdown</th> : null}
            {!compact ? <th className="px-3 py-3 font-medium">Support</th> : null}
            <th className="px-3 py-3 font-medium">Type</th>
            <th className="px-3 py-3 font-medium">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => (
            <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface/60">
              <td className="px-3 py-2.5 tabular text-ink-subtle">{i + 1}</td>
              <td className="px-3 py-2.5">
                <Link to="/processor/$slug" params={{ slug: p.slug }} className="flex items-center gap-2 min-h-11">
                  <Initials name={p.name} />
                  <span>
                    <span className="font-medium block">{p.name}</span>
                    {p.researchStatus !== "complete" ? (
                      <span className="text-xs text-ink-subtle">Research {p.researchStatus}</span>
                    ) : null}
                  </span>
                </Link>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={cn("tabular font-medium", bandClass(bandFor(p.scores.overall)?.id))}>{p.scores.overall}</span>
                  <ShortBand score={p.scores.overall} />
                </div>
              </td>
              {!compact ? <td className="px-3 py-2.5 text-ink-muted">{flagLabel(p.badges.fundsHold)}</td> : null}
              {!compact ? <td className="px-3 py-2.5 text-ink-muted">{flagLabel(p.badges.shutdown)}</td> : null}
              {!compact ? (
                <td className="px-3 py-2.5 text-ink-muted">
                  {p.snapshot.humanSupport === true ? "Human" : p.snapshot.humanSupport === "varies" ? "Varies" : "Limited"}
                </td>
              ) : null}
              <td className="px-3 py-2.5 text-ink-muted">{typeLabel(p.types[0] ?? "")}</td>
              <td className="px-3 py-2.5 tabular text-ink-muted">{p.confidence}</td>
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
      {rows.map((p, i) => (
        <li key={p.id}>
          <Link to="/processor/$slug" params={{ slug: p.slug }} className="flex items-center gap-3 px-3 py-3 min-h-14">
            <span className="tabular text-xs text-ink-subtle w-6">{i + 1}</span>
            <Initials name={p.name} />
            <span className="flex-1">
              <span className="block font-medium">{p.name}</span>
              <span className="text-xs text-ink-subtle">{typeLabel(p.types[0] ?? "")}</span>
            </span>
            <ScoreNumber value={p.scores.overall} size="sm" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

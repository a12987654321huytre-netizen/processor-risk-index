import { Link } from "@tanstack/react-router";
import { RESEARCH_STATS } from "@/data";
import { LAST_RECALCULATED, LAST_VERIFIED } from "@/lib/site";

export function ResearchTracker({ compact }: { compact?: boolean }) {
  const s = RESEARCH_STATS;
  const bits = [
    ["RANKED", String(s.ranked)],
    ["HIGH CONF", String(s.highConfidence)],
    ["MED CONF", String(s.mediumConfidence)],
    ["LOW CONF", String(s.lowConfidence)],
    ["UPDATED", LAST_RECALCULATED.toUpperCase()],
  ];
  if (compact) {
    return (
      <p className="receipt text-ink-muted">
        {s.total} ranked · {s.highConfidence} high-conf · {LAST_RECALCULATED}
      </p>
    );
  }
  return (
    <aside className="border border-border bg-bg-elevated px-3 py-3">
      <p className="meta">Index coverage</p>
      <dl className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-x-3 gap-y-2">
        {bits.map(([k, v]) => (
          <div key={k}>
            <dt className="receipt">{k}</dt>
            <dd className="tabular text-sm mt-0.5">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-ink-subtle">
        Research status describes evidence quality, not whether a provider is allowed to rank. Last research pass{" "}
        {LAST_VERIFIED}.{" "}
        <Link to="/methodology" className="text-accent hover:underline">
          Risk vs confidence
        </Link>
      </p>
    </aside>
  );
}

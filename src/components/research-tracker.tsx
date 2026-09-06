import { Link } from "@tanstack/react-router";
import { RESEARCH_STATS } from "@/data";
import { LAST_RECALCULATED, LAST_VERIFIED } from "@/lib/site";

export function ResearchTracker({ compact }: { compact?: boolean }) {
  const s = RESEARCH_STATS;
  const bits = [
    `${s.ranked} ranked`,
    `${s.highConfidence} high-confidence`,
    `${s.mediumConfidence} medium-confidence`,
    `${s.lowConfidence} lower-confidence`,
  ];
  return (
    <aside className={compact ? "text-sm text-ink-muted" : "rounded-md border border-border bg-bg-elevated p-4"}>
      {compact ? null : <p className="text-xs uppercase tracking-[0.18em] text-accent font-medium">Index coverage</p>}
      <p className={compact ? "" : "mt-2 text-sm text-ink-muted"}>
        {s.total} providers. {bits.join(" · ")}. Last recalculated {LAST_RECALCULATED}.
      </p>
      {compact ? null : (
        <p className="mt-2 text-xs text-ink-subtle">
          Research status describes evidence quality, not whether a provider is allowed to rank. Last research pass{" "}
          {LAST_VERIFIED}.{" "}
          <Link to="/methodology" className="text-accent hover:underline">
            Risk vs confidence
          </Link>
        </p>
      )}
    </aside>
  );
}

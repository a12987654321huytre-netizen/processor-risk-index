import { Link, useNavigate } from "@tanstack/react-router";
import { PROVIDERS, getProvider } from "@/data";
import { DIMENSION_META, flagLabel, typeLabel } from "@/data/scoring";
import { BandBadge, ScoreBar, ScoreNumber } from "@/components/score";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { infraWarnings } from "@/data";
import { researchStatusLabel } from "@/data/eligibility";

export function parseCompareSlugs(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/-vs-|,/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 4);
}

export function toComparePath(ids: string[]): string {
  return ids.filter(Boolean).join("-vs-");
}

export function CompareView({ ids }: { ids: string[] }) {
  const nav = useNavigate();
  const selected = ids.map((id) => getProvider(id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const warnings = infraWarnings(selected.map((p) => p.id));

  function setSlot(index: number, value: string) {
    const next = [...ids];
    next[index] = value;
    const clean = next.filter(Boolean).slice(0, 4);
    void nav({ to: "/compare/$slugs", params: { slugs: toComparePath(clean) } });
  }

  function addSlot() {
    if (ids.length >= 4) return;
    const unused = PROVIDERS.find((p) => !ids.includes(p.id));
    if (unused) setSlot(ids.length, unused.id);
  }

  const slots = [0, 1, 2, 3].slice(0, Math.max(2, selected.length, ids.length));

  return (
    <div className="page-wrap py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-accent font-medium">Side by side</p>
      <h1 className="mt-2 font-display text-4xl">Compare</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Up to four processors. URL is shareable. Horizontal bars, not a radar chart — this is a research table, not a
        video game.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {slots.map((i) => (
          <Select key={i} value={ids[i] ?? ""} onChange={(e) => setSlot(i, e.target.value)} aria-label={`Processor ${i + 1}`}>
            <option value="">Select…</option>
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id} disabled={ids.includes(p.id) && ids[i] !== p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        ))}
      </div>
      {ids.length < 4 ? (
        <Button variant="ghost" className="mt-2" onClick={addSlot}>
          Add a processor
        </Button>
      ) : null}

      {warnings.map((w) => (
        <p key={w.id} className="mt-4 border border-risk-high/30 bg-risk-high-bg p-3 text-sm text-risk-high">
          {w.warning}
        </p>
      ))}

      {selected.length < 2 ? (
        <p className="mt-8 text-ink-muted">Pick at least two processors.</p>
      ) : (
        <div className="mt-8 overflow-x-auto border border-border bg-bg-elevated">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="p-3 text-left text-xs uppercase tracking-wide text-ink-subtle">Metric</th>
                {selected.map((p) => (
                  <th key={p.id} className="p-3 text-left">
                    <Link to="/processor/$slug" params={{ slug: p.slug }} className="font-medium">
                      {p.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="p-3 text-ink-subtle">Overall</td>
                {selected.map((p) => (
                  <td key={p.id} className="p-3">
                    <p className="text-xs text-ink-subtle">#{p.rank}</p>
                    <ScoreNumber value={p.publishedOverall} size="sm" />
                    <div className="mt-1">
                      <BandBadge score={p.publishedOverall} />
                    </div>
                    {p.structuralNote ? <p className="mt-2 text-xs text-ink-subtle">{p.structuralNote}</p> : null}
                  </td>
                ))}
              </tr>
              {DIMENSION_META.map((d) => (
                <tr key={d.key} className="border-b border-border">
                  <td className="p-3 text-ink-subtle">{d.label}</td>
                  {selected.map((p) => (
                    <td key={p.id} className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="tabular w-8">
                          {p.dimensions[d.key] % 1 === 0 ? p.dimensions[d.key] : p.dimensions[d.key].toFixed(1)}
                        </span>
                        <div className="flex-1">
                          <ScoreBar value={p.dimensions[d.key]} />
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              {(
                [
                  ["Rank", (p: (typeof selected)[0]) => `#${p.rank}`],
                  ["Shutdown", (p: (typeof selected)[0]) => flagLabel(p.badges.shutdown)],
                  ["Funds hold", (p: (typeof selected)[0]) => flagLabel(p.badges.fundsHold)],
                  ["Reserve", (p: (typeof selected)[0]) => flagLabel(p.badges.reserve)],
                  ["Digital goods", (p: (typeof selected)[0]) => flagLabel(p.badges.digitalGoods)],
                  ["High ticket", (p: (typeof selected)[0]) => flagLabel(p.badges.highTicket)],
                  ["Dependency", (p: (typeof selected)[0]) => flagLabel(p.badges.platformDependency)],
                  ["MoR?", (p: (typeof selected)[0]) => (p.isMoR ? "Yes" : "No")],
                  ["Type", (p: (typeof selected)[0]) => typeLabel(p.types[0] ?? "")],
                  ["Countries (sourced)", (p: (typeof selected)[0]) => p.merchantCountries.slice(0, 6).join(", ") || "See note"],
                  ["Confidence", (p: (typeof selected)[0]) => String(p.confidence)],
                  ["Research", (p: (typeof selected)[0]) => researchStatusLabel(p.researchStatus)],
                ] as const
              ).map(([label, fn]) => (
                <tr key={label} className="border-b border-border last:border-0">
                  <td className="p-3 text-ink-subtle">{label}</td>
                  {selected.map((p) => (
                    <td key={p.id} className="p-3">
                      {fn(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

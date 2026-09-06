import { bandFor, confidenceShort, flagLabel, type RiskBand } from "@/data/scoring";
import type { FlagLevel } from "@/data/types";
import { cn } from "@/lib/utils";

export function bandTone(id: RiskBand["id"] | undefined): "low" | "guarded" | "moderate" | "high" | "very-high" | "extreme" {
  return (id ?? "moderate") as "low" | "guarded" | "moderate" | "high" | "very-high" | "extreme";
}

const FLAG_TONE: Record<FlagLevel, "low" | "guarded" | "moderate" | "high" | "very-high"> = {
  low: "low",
  moderate: "moderate",
  high: "high",
  "very-high": "very-high",
  unknown: "guarded",
};

export function ScoreNumber({
  value,
  size = "md",
}: {
  value: number | null | undefined;
  size?: "sm" | "md" | "lg";
}) {
  if (value === null || value === undefined) {
    return <span className="text-sm text-ink-subtle font-sans">—</span>;
  }
  const band = bandFor(value);
  const sizes = { sm: "text-lg", md: "text-3xl", lg: "text-5xl" };
  return (
    <span className={cn("tabular font-display font-semibold tracking-tight", sizes[size], bandClass(band?.id))}>
      {value}
      <span className="text-ink-subtle font-sans text-sm font-normal tracking-normal"> / 100</span>
    </span>
  );
}

export function bandClass(id: RiskBand["id"] | undefined): string {
  switch (id) {
    case "low":
      return "text-risk-low";
    case "guarded":
      return "text-risk-guarded";
    case "moderate":
      return "text-risk-moderate";
    case "high":
      return "text-risk-high";
    case "very-high":
      return "text-risk-very-high";
    case "extreme":
      return "text-risk-extreme";
    default:
      return "text-ink";
  }
}

export function BandBadge({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return null;
  }
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
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-sm px-2 py-1 text-xs font-medium", bg[band.id])}>
      <span>{band.label}</span>
      <span className="opacity-80 font-normal">{band.cheeky}</span>
    </span>
  );
}

export function ConfidenceBadge({ value }: { value: number }) {
  const c = confidenceShort(value);
  const tone =
    c.tone === "high" ? "bg-risk-low-bg text-risk-low" : c.tone === "medium" ? "bg-risk-moderate-bg text-risk-moderate" : "bg-risk-high-bg text-risk-high";
  const title =
    c.tone === "low"
      ? "This ranking is based on incomplete evidence and may change materially as additional research is added."
      : c.tone === "medium"
        ? "A usable evidence-based assessment; important research gaps remain."
        : "Unusually strong evidence supporting this assessment.";
  return (
    <span className={cn("inline-flex rounded-sm px-2 py-1 text-xs font-medium", tone)} title={title}>
      {value} · {c.label}
    </span>
  );
}

export function FlagChip({ label, level }: { label: string; level: FlagLevel }) {
  const tone = FLAG_TONE[level];
  const bg: Record<string, string> = {
    low: "bg-risk-low-bg text-risk-low",
    guarded: "bg-risk-guarded-bg text-risk-guarded",
    moderate: "bg-risk-moderate-bg text-risk-moderate",
    high: "bg-risk-high-bg text-risk-high",
    "very-high": "bg-risk-very-high-bg text-risk-very-high",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs border border-border", bg[tone])}>
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium">{flagLabel(level)}</span>
    </span>
  );
}

export function ScoreBar({ value, max = 10, tone }: { value: number; max?: number; tone?: RiskBand["id"] }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const bar: Record<string, string> = {
    low: "bg-risk-low",
    guarded: "bg-risk-guarded",
    moderate: "bg-risk-moderate",
    high: "bg-risk-high",
    "very-high": "bg-risk-very-high",
    extreme: "bg-risk-extreme",
  };
  const id = tone ?? (value >= 8 ? "very-high" : value >= 6 ? "high" : value >= 4 ? "moderate" : "low");
  return (
    <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden" aria-hidden="true">
      <div
        className={cn("h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500", bar[id])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Initials({ name }: { name: string }) {
  const parts = name.replace(/[^a-zA-Z0-9 ]/g, " ").trim().split(/\s+/);
  const letters = (parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "");
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-sm bg-surface text-xs font-medium text-ink-muted"
    >
      {letters.toUpperCase()}
    </span>
  );
}

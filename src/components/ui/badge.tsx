import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "accent" | "low" | "guarded" | "moderate" | "high" | "very-high" | "extreme";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-surface text-ink-muted border-border",
    accent: "bg-accent-soft text-accent border-accent/20",
    low: "bg-risk-low-bg text-risk-low border-risk-low/20",
    guarded: "bg-risk-guarded-bg text-risk-guarded border-risk-guarded/20",
    moderate: "bg-risk-moderate-bg text-risk-moderate border-risk-moderate/20",
    high: "bg-risk-high-bg text-risk-high border-risk-high/20",
    "very-high": "bg-risk-very-high-bg text-risk-very-high border-risk-very-high/20",
    extreme: "bg-risk-extreme-bg text-risk-extreme border-risk-extreme/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

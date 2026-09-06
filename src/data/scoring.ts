import type {
  DimensionScores,
  FlagLevel,
  Scores,
  Provider,
} from "./types";

export const WEIGHTS = {
  suspension: 0.24,
  fundsHold: 0.24,
  underwriting: 0.14,
  appeal: 0.12,
  policy: 0.1,
  incidents: 0.08,
  dependency: 0.08,
} as const;

export function computeOverall(d: DimensionScores): number {
  const raw =
    d.suspension * WEIGHTS.suspension +
    d.fundsHold * WEIGHTS.fundsHold +
    d.underwriting * WEIGHTS.underwriting +
    d.appeal * WEIGHTS.appeal +
    d.policy * WEIGHTS.policy +
    d.incidents * WEIGHTS.incidents +
    d.dependency * WEIGHTS.dependency;
  return Math.round(raw * 10);
}

export function withScores(d: DimensionScores): Scores {
  return { ...d, overall: computeOverall(d) };
}

export type RiskBand = {
  id: "low" | "guarded" | "moderate" | "high" | "very-high" | "extreme";
  label: string;
  cheeky: string;
  min: number;
  max: number;
  colorVar: string;
};

export const RISK_BANDS: RiskBand[] = [
  { id: "low", label: "Low", cheeky: "Pretty chill", min: 0, max: 24, colorVar: "risk-low" },
  { id: "guarded", label: "Guarded", cheeky: "Keep an eye on it", min: 25, max: 39, colorVar: "risk-guarded" },
  { id: "moderate", label: "Moderate", cheeky: "Have a backup", min: 40, max: 59, colorVar: "risk-moderate" },
  { id: "high", label: "High", cheeky: "Don't get comfy", min: 60, max: 74, colorVar: "risk-high" },
  { id: "very-high", label: "Very high", cheeky: "Two processors. Minimum.", min: 75, max: 89, colorVar: "risk-very-high" },
  { id: "extreme", label: "Extreme dependency", cheeky: "You're living dangerously", min: 90, max: 100, colorVar: "risk-extreme" },
];

export function bandFor(score: number | null): RiskBand | null {
  if (score === null || Number.isNaN(score)) return null;
  return RISK_BANDS.find((b) => score >= b.min && score <= b.max) ?? RISK_BANDS[RISK_BANDS.length - 1];
}

export function confidenceLabel(n: number): { label: string; tone: "high" | "medium" | "low"; band: "high" | "good" | "medium" | "low" | "very-low" } {
  if (n >= 85) return { label: "High confidence", tone: "high", band: "high" };
  if (n >= 70) return { label: "High confidence", tone: "high", band: "good" };
  if (n >= 50) return { label: "Medium confidence", tone: "medium", band: "medium" };
  if (n >= 30) return { label: "Low confidence", tone: "low", band: "low" };
  return { label: "Low confidence", tone: "low", band: "very-low" };
}

/** Public three-band confidence used on the leaderboard. */
export function confidenceShort(n: number): { label: "High" | "Medium" | "Low"; tone: "high" | "medium" | "low" } {
  if (n >= 70) return { label: "High", tone: "high" };
  if (n >= 50) return { label: "Medium", tone: "medium" };
  return { label: "Low", tone: "low" };
}

export function flagFromScore(n: number): FlagLevel {
  if (n >= 8) return "very-high";
  if (n >= 6) return "high";
  if (n >= 4) return "moderate";
  return "low";
}

export function flagLabel(f: FlagLevel): string {
  switch (f) {
    case "low":
      return "Low";
    case "moderate":
      return "Moderate";
    case "high":
      return "High";
    case "very-high":
      return "Very high";
    default:
      return "Unknown";
  }
}

export const DIMENSION_META: {
  key: keyof DimensionScores;
  label: string;
  weightPct: number;
  help: string;
}[] = [
  {
    key: "suspension",
    label: "Suspension & termination",
    weightPct: 24,
    help: "Contractual termination powers, notice, and the pattern of sudden account closures.",
  },
  {
    key: "fundsHold",
    label: "Funds hold & reserves",
    weightPct: 24,
    help: "Rolling/minimum reserves, payout pauses, and funds retained after closure.",
  },
  {
    key: "underwriting",
    label: "Underwriting predictability",
    weightPct: 14,
    help: "Whether review happens before you process, or after you already depend on them.",
  },
  {
    key: "appeal",
    label: "Appeal & support",
    weightPct: 12,
    help: "Human support, phone, account managers, and documented reinstatements.",
  },
  {
    key: "policy",
    label: "Policy breadth & clarity",
    weightPct: 10,
    help: "Restricted-business lists, vague catch-alls, and whether prior approval can be withdrawn.",
  },
  {
    key: "incidents",
    label: "Merchant incident pattern",
    weightPct: 8,
    help: "Independent reports, severity, recency, reversals, and merchant-responsibility flags. Capped so internet complaints cannot dominate.",
  },
  {
    key: "dependency",
    label: "Platform dependency",
    weightPct: 8,
    help: "How hard it is to leave: tokens, checkout, subscriptions, Merchant of Record coupling.",
  },
];

export function rankProviders(providers: Provider[]): Provider[] {
  return [...providers].sort(
    (a, b) =>
      (b.publishedOverall ?? b.scores.overall) - (a.publishedOverall ?? a.scores.overall) ||
      b.confidence - a.confidence ||
      a.name.localeCompare(b.name),
  );
}

export function safestFirst(providers: Provider[]): Provider[] {
  return [...providers].sort(
    (a, b) =>
      (a.publishedOverall ?? a.scores.overall) - (b.publishedOverall ?? b.scores.overall) ||
      a.name.localeCompare(b.name),
  );
}

export function riskiestFirst(providers: Provider[]): Provider[] {
  return [...providers].sort(
    (a, b) =>
      (b.publishedOverall ?? b.scores.overall) - (a.publishedOverall ?? a.scores.overall) ||
      a.name.localeCompare(b.name),
  );
}

export function typeLabel(t: string): string {
  const map: Record<string, string> = {
    "direct-acquirer": "Direct acquirer",
    psp: "PSP",
    "payment-aggregator": "Aggregator",
    gateway: "Gateway",
    wallet: "Wallet",
    "merchant-of-record": "Merchant of Record",
    "pay-by-bank": "Pay-by-bank",
    "platform-payments": "Platform payments",
    "merchant-account-provider": "Merchant account",
    "alternative-payment-method": "APM",
    hybrid: "Hybrid",
  };
  return map[t] ?? t;
}

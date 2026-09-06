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

export function computeOverallRaw(d: DimensionScores): number {
  return (
    d.suspension * WEIGHTS.suspension +
    d.fundsHold * WEIGHTS.fundsHold +
    d.underwriting * WEIGHTS.underwriting +
    d.appeal * WEIGHTS.appeal +
    d.policy * WEIGHTS.policy +
    d.incidents * WEIGHTS.incidents +
    d.dependency * WEIGHTS.dependency
  ) * 10;
}

export function computeOverall(d: DimensionScores): number {
  return Math.round(computeOverallRaw(d));
}

export function withScores(d: DimensionScores): Scores {
  const overallRaw = computeOverallRaw(d);
  return { ...d, overall: Math.round(overallRaw), overallRaw };
}

export type RiskBand = {
  id: "low" | "guarded" | "moderate" | "elevated" | "high" | "severe";
  label: string;
  cheeky: string;
  min: number;
  max: number;
  colorVar: string;
};

export const RISK_BANDS: RiskBand[] = [
  { id: "low", label: "Low", cheeky: "Actually pretty chill", min: 0, max: 29, colorVar: "risk-low" },
  { id: "guarded", label: "Guarded", cheeky: "Keep an eye on it", min: 30, max: 44, colorVar: "risk-guarded" },
  { id: "moderate", label: "Moderate", cheeky: "This is something to understand, not panic about", min: 45, max: 59, colorVar: "risk-moderate" },
  { id: "elevated", label: "Elevated", cheeky: "A backup is sensible, not an evacuation order", min: 60, max: 69, colorVar: "risk-elevated" },
  { id: "high", label: "High", cheeky: "Worth planning around", min: 70, max: 79, colorVar: "risk-high" },
  { id: "severe", label: "Severe", cheeky: "Two processors is just hygiene", min: 80, max: 100, colorVar: "risk-severe" },
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
      return "Limited";
    case "high":
      return "Elevated";
    case "very-high":
      return "High";
    default:
      return "Unknown";
  }
}

/** Human labels for a 0–10 dimension. Avoids Very high / Extreme. */
export function dimBand(n: number): { id: RiskBand["id"]; label: string } {
  if (n <= 2.5) return { id: "low", label: "Low" };
  if (n <= 4.5) return { id: "guarded", label: "Limited" };
  if (n <= 6.5) return { id: "moderate", label: "Moderate" };
  if (n <= 8.5) return { id: "elevated", label: "Elevated" };
  return { id: "high", label: "High" };
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

export function compareRiskDesc(a: Provider, b: Provider): number {
  const aPub = a.publishedOverall ?? a.scores.overall;
  const bPub = b.publishedOverall ?? b.scores.overall;
  return (
    bPub - aPub ||
    b.scores.overallRaw - a.scores.overallRaw ||
    b.dimensions.fundsHold - a.dimensions.fundsHold ||
    b.dimensions.suspension - a.dimensions.suspension ||
    b.dimensions.dependency - a.dimensions.dependency ||
    a.name.localeCompare(b.name)
  );
}

/** Rank 1 first. After enrich, this is the assigned rank order. */
export function rankProviders(providers: Provider[]): Provider[] {
  return [...providers].sort((a, b) => {
    if (a.rank && b.rank) return a.rank - b.rank;
    return compareRiskDesc(a, b);
  });
}

export function safestFirst(providers: Provider[]): Provider[] {
  return [...providers].sort((a, b) => {
    if (a.rank && b.rank) return b.rank - a.rank;
    return -compareRiskDesc(a, b);
  });
}

export function riskiestFirst(providers: Provider[]): Provider[] {
  return rankProviders(providers);
}

export function riskAnnotation(n: number | null | undefined): string | null {
  if (n === null || n === undefined) return null;
  if (n >= 80) return "two processors is just hygiene";
  if (n >= 70) return "worth planning around";
  if (n >= 60) return "a backup is sensible, not an evacuation order";
  if (n >= 45) return "this is something to understand, not panic about";
  if (n <= 35) return "boring is good here";
  return null;
}

export function dependencyAnnotation(n: number): string | null {
  if (n >= 8) return "this is the bit we'd actually plan around";
  return null;
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

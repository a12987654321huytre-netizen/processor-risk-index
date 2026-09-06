import type {
  Alternative,
  ConfidenceBreakdown,
  DimensionScores,
  OfficialCoverage,
  OfficialFinding,
  Provider,
  ReportBucket,
  ResearchDepth,
  ResearchStatus,
} from "./types";
import { withScores } from "./scoring";

export const VERIFIED = "2026-09-06";

const EMPTY_CONF: ConfidenceBreakdown = {
  official: 0,
  independent: 0,
  recency: 0,
  jurisdiction: 0,
  diversity: 0,
  contradiction: 0,
  total: 0,
  band: "very-low",
};

const EMPTY_DEPTH: ResearchDepth = {
  officialSources: 0,
  independentReports: 0,
  jurisdictions: 0,
  incidents: 0,
  successfulResolutions: 0,
  lastVerified: VERIFIED,
  band: "low",
};

const EMPTY_COV: OfficialCoverage = {
  termination: false,
  holdsReserves: false,
  restricted: false,
  payouts: false,
  geography: false,
  appealSupport: false,
  officialSourceCount: 0,
  comprehensiveAgreement: false,
  points: 0,
  missing: [],
};

function normalizeStatus(s: string | undefined): ResearchStatus {
  if (s === "verified" || s === "provisional" || s === "in-research" || s === "pending") return s;
  if (s === "researched" || s === "complete") return "verified";
  if (s === "partial") return "in-research";
  if (s === "unresearched" || s === "pending") return "pending";
  return "in-research";
}

export type ProviderDraft = Omit<
  Provider,
  | "scores"
  | "slug"
  | "publishedOverall"
  | "rankEligible"
  | "rank"
  | "previousRank"
  | "rankDelta"
  | "confidenceBreakdown"
  | "researchDepth"
  | "officialCoverage"
  | "dimensionExplanations"
  | "structuralNote"
  | "researchStatus"
> & {
  slug?: string;
  researchStatus?: string;
};

export function makeProvider(p: ProviderDraft): Provider {
  return {
    ...p,
    slug: p.slug ?? p.id,
    scores: withScores(p.dimensions),
    researchStatus: normalizeStatus(p.researchStatus),
    publishedOverall: 0,
    rankEligible: true,
    rank: 0,
    previousRank: null,
    rankDelta: null,
    confidenceBreakdown: EMPTY_CONF,
    researchDepth: EMPTY_DEPTH,
    officialCoverage: EMPTY_COV,
    dimensionExplanations: [],
    structuralNote: null,
  };
}

export function dim(
  suspension: number,
  fundsHold: number,
  underwriting: number,
  appeal: number,
  policy: number,
  incidents: number,
  dependency: number,
): DimensionScores {
  return { suspension, fundsHold, underwriting, appeal, policy, incidents, dependency };
}

export function findings(
  items: Array<[OfficialFinding["topic"], string, string, string, string?]>,
): OfficialFinding[] {
  return items.map(([topic, title, paraphrase, sourceId, jurisdiction], i) => ({
    id: `${sourceId}-f${i}`,
    topic,
    title,
    paraphrase,
    sourceId,
    jurisdiction,
  }));
}

export function buckets(items: Array<[string, string, number | null, string]>): ReportBucket[] {
  return items.map(([key, label, count, note]) => ({ key, label, count, note }));
}

export function alts(items: Array<[string, Alternative["kind"], string]>): Alternative[] {
  return items.map(([providerId, kind, why]) => ({ providerId, kind, why }));
}

export const defaultRiskReduction = [
  "Describe the business accurately at onboarding and keep that description current.",
  "Complete KYC and identity checks early, before volume ramps.",
  "Keep formation documents, bank statements and beneficial-owner IDs ready.",
  "Publish a clear refund and fulfilment policy and match it in practice.",
  "Use a billing descriptor customers will recognise.",
  "Watch chargeback and refund rates; respond to disputes with evidence.",
  "Tell the processor before a material business-model change.",
  "Keep fulfilment and delivery evidence for high-ticket or delayed orders.",
  "Hold operating cash outside the processor so a payout pause is not existential.",
  "Connect a backup processor while the primary account is healthy.",
];

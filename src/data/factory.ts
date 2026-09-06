import type {
  Alternative,
  DimensionScores,
  OfficialFinding,
  Provider,
  ReportBucket,
} from "./types";
import { withScores } from "./scoring";

export const VERIFIED = "2026-09-06";

export function makeProvider(
  p: Omit<Provider, "scores" | "slug"> & { slug?: string },
): Provider {
  return {
    ...p,
    slug: p.slug ?? p.id,
    scores: withScores(p.dimensions),
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
  items: Array<
    [OfficialFinding["topic"], string, string, string, string?]
  >,
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

export function buckets(
  items: Array<[string, string, number | null, string]>,
): ReportBucket[] {
  return items.map(([key, label, count, note]) => ({ key, label, count, note }));
}

export function alts(
  items: Array<[string, Alternative["kind"], string]>,
): Alternative[] {
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

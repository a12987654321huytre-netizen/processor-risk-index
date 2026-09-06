import { makeProvider, dim, findings, buckets, alts, defaultRiskReduction, VERIFIED } from "./factory";
import type {
  Alternative,
  DimensionScores,
  FlagLevel,
  OfficialFinding,
  Provider,
  ProviderType,
  Region,
  RiskFlags,
  SupportLevel,
  YesNoVaries,
} from "./types";
import { flagFromScore } from "./scoring";

export interface CompactInput {
  id: string;
  name: string;
  aliases?: string[];
  legalName: string;
  headquarters: string;
  website: string;
  types: ProviderType[];
  regions: Region[];
  merchantCountries: string[];
  merchantCountriesNote: string;
  merchantCountriesSourced?: boolean;
  currenciesNote?: string;
  paymentMethods: string[];
  acquiringModel: string;
  isMoR: boolean;
  hasDirectMerchantAccount: YesNoVaries;
  isAggregator: boolean;
  underlyingAcquirers?: string[];
  infrastructureNotes?: string[];
  typicalMerchantSize: string[];
  focus: "sme" | "enterprise" | "both";
  supports: Provider["supports"];
  dimensions: DimensionScores;
  confidence: number;
  researchStatus?: Provider["researchStatus"];
  badges?: Partial<RiskFlags>;
  snapshot: Provider["snapshot"];
  verdictShort: string;
  cheekyLine: string;
  whoFor: Provider["whoFor"];
  contract: Array<[OfficialFinding["topic"], string, string, string, string?]>;
  reportNotes?: Array<[string, string, number | null, string]>;
  positives?: Array<[string, string, string | null]>;
  triggers?: Array<[string, Provider["triggers"][0]["evidence"], string[]]>;
  ohShit: Provider["ohShit"];
  alternatives: Array<[string, Alternative["kind"], string]>;
  extraRisk?: string[];
  complaintNote: string;
  sourceIds: string[];
  digital?: FlagLevel;
  highTicket?: FlagLevel;
}

function badgesFrom(d: DimensionScores, extra: Partial<RiskFlags> = {}): RiskFlags {
  return {
    shutdown: extra.shutdown ?? flagFromScore(d.suspension),
    fundsHold: extra.fundsHold ?? flagFromScore(d.fundsHold),
    reserve: extra.reserve ?? flagFromScore(d.fundsHold),
    kycReview: extra.kycReview ?? flagFromScore(d.underwriting),
    suddenGrowth: extra.suddenGrowth ?? flagFromScore(d.underwriting),
    highTicket: extra.highTicket ?? flagFromScore(Math.max(d.underwriting, d.fundsHold) - 0.5),
    chargeback: extra.chargeback ?? flagFromScore(d.fundsHold - 0.5),
    digitalGoods: extra.digitalGoods ?? extra.highTicket ?? flagFromScore(d.policy),
    crossBorder: extra.crossBorder ?? "moderate",
    appealFriction: extra.appealFriction ?? flagFromScore(d.appeal),
    platformDependency: extra.platformDependency ?? flagFromScore(d.dependency),
  };
}

export function compact(c: CompactInput): Provider {
  return makeProvider({
    id: c.id,
    name: c.name,
    aliases: c.aliases ?? [],
    legalName: c.legalName,
    headquarters: c.headquarters,
    website: c.website,
    types: c.types,
    regions: c.regions,
    merchantCountries: c.merchantCountries,
    merchantCountriesNote: c.merchantCountriesNote,
    merchantCountriesSourced: c.merchantCountriesSourced ?? true,
    currenciesNote: c.currenciesNote ?? "Confirm live currency list with the provider.",
    paymentMethods: c.paymentMethods,
    acquiringModel: c.acquiringModel,
    isMoR: c.isMoR,
    hasDirectMerchantAccount: c.hasDirectMerchantAccount,
    isAggregator: c.isAggregator,
    underlyingAcquirers: c.underlyingAcquirers ?? [],
    infrastructureNotes: c.infrastructureNotes ?? [],
    typicalMerchantSize: c.typicalMerchantSize,
    focus: c.focus,
    supports: c.supports,
    dimensions: c.dimensions,
    confidence: c.confidence,
    researchStatus: c.researchStatus ?? "complete",
    lastVerified: VERIFIED,
    badges: badgesFrom(c.dimensions, c.badges),
    snapshot: c.snapshot,
    verdict: { short: c.verdictShort, cheekyLine: c.cheekyLine },
    whoFor: c.whoFor,
    contract: findings(c.contract),
    reportBuckets: buckets(
      c.reportNotes ?? [
        ["shutdown", "Public shutdown reports", null, "Sample is limited or not normalised for merchant base."],
        ["holds", "Hold / reserve reports", null, "See contract section for documented powers."],
        ["appeals", "Documented restorations", null, "Not enough independent reports to establish a pattern unless noted."],
      ],
    ),
    incidents: [],
    positiveOutcomes: (c.positives ?? []).map(([id, summary, date], i) => ({
      id: id || `${c.id}-pos-${i}`,
      summary,
      sourceIds: c.sourceIds.slice(0, 1),
      date,
    })),
    triggers: (c.triggers ?? []).map((t, i) => ({
      id: `${c.id}-t${i}`,
      text: t[0],
      evidence: t[1],
      sourceIds: t[2],
    })),
    ohShit: c.ohShit,
    alternatives: alts(c.alternatives),
    riskReduction: [...defaultRiskReduction, ...(c.extraRisk ?? [])],
    timeline: [],
    timelineTrend: "insufficient",
    complaintVolumeNormalised: false,
    complaintVolumeNote: c.complaintNote,
    sourceIds: c.sourceIds,
  });
}

export { dim };
export type { SupportLevel };

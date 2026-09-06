export type ProviderType =
  | "direct-acquirer"
  | "psp"
  | "payment-aggregator"
  | "gateway"
  | "wallet"
  | "merchant-of-record"
  | "pay-by-bank"
  | "platform-payments"
  | "merchant-account-provider"
  | "alternative-payment-method"
  | "hybrid";

export type Region =
  | "global"
  | "usa"
  | "canada"
  | "uk"
  | "eu"
  | "latam"
  | "india"
  | "apac"
  | "mena"
  | "africa";

export type BusinessModel =
  | "ecommerce"
  | "digital-downloads"
  | "saas"
  | "subscriptions"
  | "services"
  | "marketplaces"
  | "high-ticket"
  | "physical-retail"
  | "freelancers";

export type SupportLevel = "yes" | "limited" | "no" | "unknown";
export type FlagLevel = "low" | "moderate" | "high" | "very-high" | "unknown";
export type EvidenceLabel =
  | "official-policy"
  | "merchant-report"
  | "independent-reporting"
  | "provider-statement"
  | "unverified-anecdote";
export type EvidenceTier = 1 | 2 | 3 | 4 | 5;
export type MerchantResponsibility =
  | "unlikely"
  | "possible"
  | "likely"
  | "confirmed"
  | "unknown";
export type IncidentType =
  | "temporary-review"
  | "payout-pause"
  | "rolling-reserve"
  | "minimum-reserve"
  | "account-suspension"
  | "permanent-termination"
  | "kyc-failure"
  | "fraud-false-positive"
  | "prohibited-business-enforcement"
  | "chargeback-intervention"
  | "unusual-volume-intervention"
  | "high-ticket-intervention"
  | "cross-border-intervention"
  | "bank-account-verification"
  | "unknown";
export type IncidentOutcome =
  | "restored-automatically"
  | "restored-after-documents"
  | "restored-after-appeal"
  | "restored-after-escalation"
  | "partially-restored"
  | "permanently-closed"
  | "funds-released"
  | "funds-still-held"
  | "reserve-removed"
  | "reserve-remained"
  | "unresolved"
  | "outcome-unknown";
export type SourceType =
  | "official-agreement"
  | "help-centre"
  | "regulatory"
  | "journalism"
  | "reddit"
  | "forum"
  | "review-platform"
  | "public-social"
  | "court"
  | "filing";
export type TriggerEvidence = "officially-documented" | "strong-merchant-pattern" | "anecdotal" | "unknown";

/** Published research status. Metadata only — every provider still receives a rank. */
export type ResearchStatus = "verified" | "provisional" | "in-research" | "pending";
export type ResearchTier = ResearchStatus;
export type Trend = "rising" | "stable" | "declining" | "insufficient";
export type YesNoVaries = boolean | "varies" | "unknown";

export type SupportAccess =
  | "24-7-phone-chat-email"
  | "phone-available"
  | "chat-email"
  | "ticket-only"
  | "account-manager-qualifying"
  | "varies-by-plan"
  | "unknown";

export type EscalationQuality = "good" | "mixed" | "poor" | "insufficient-evidence";

export type ConfidenceBand = "high" | "good" | "medium" | "low" | "very-low";
export type ResearchDepthBand = "high" | "medium" | "low";
export type IncidentStrength = "high" | "medium" | "low" | "anecdotal";

export type AltKind =
  | "closest-replacement"
  | "lower-risk-escape"
  | "lower-lockout"
  | "diversify-rail"
  | "independent-rail"
  | "easier-onboarding"
  | "enterprise-step-up"
  | "enterprise"
  | "merchant-of-record"
  | "backup-not-replacement";

export type InfraKind = "ownership" | "processing" | "acquiring" | "unknown";

export type EligibilityCta = "eligible" | "likely-eligible" | "enterprise-required" | "not-available" | "unknown";

export interface DimensionScores {
  /** 0–10. Higher = more lockout exposure. */
  suspension: number;
  fundsHold: number;
  underwriting: number;
  appeal: number;
  policy: number;
  incidents: number;
  dependency: number;
}

export interface Scores extends DimensionScores {
  overall: number;
}

export interface RiskFlags {
  shutdown: FlagLevel;
  fundsHold: FlagLevel;
  reserve: FlagLevel;
  kycReview: FlagLevel;
  suddenGrowth: FlagLevel;
  highTicket: FlagLevel;
  chargeback: FlagLevel;
  digitalGoods: FlagLevel;
  crossBorder: FlagLevel;
  appealFriction: FlagLevel;
  platformDependency: FlagLevel;
}

export interface Source {
  id: string;
  providerId: string;
  title: string;
  url: string;
  sourceType: SourceType;
  publicationDate: string | null;
  accessedDate: string;
  jurisdiction: string | null;
  topics: string[];
  evidenceTier: EvidenceTier;
  notes: string;
  archivedUrl?: string | null;
}

export interface OfficialFinding {
  id: string;
  topic:
    | "suspension"
    | "termination"
    | "funds-holds"
    | "reserves"
    | "restricted-businesses"
    | "verification"
    | "disputes"
    | "payouts"
    | "support"
    | "appeal"
    | "other";
  title: string;
  paraphrase: string;
  sourceId: string;
  jurisdiction?: string;
}

export interface Incident {
  id: string;
  providerId: string;
  date: string | null;
  sourceIds: string[];
  incidentType: IncidentType;
  outcome: IncidentOutcome;
  industry: string | null;
  country: string | null;
  accountAge: string | null;
  volume: string | null;
  transactionSize: string | null;
  merchantResponsibility: MerchantResponsibility;
  evidenceStrength: IncidentStrength;
  duplicateGroup: string | null;
  summary: string;
  label: EvidenceLabel;
  trigger?: string | null;
  processorExplanation?: string | null;
  merchantExplanation?: string | null;
}

export interface ReportBucket {
  key: string;
  label: string;
  count: number | null;
  note: string;
}

export interface PositiveOutcome {
  id: string;
  summary: string;
  sourceIds: string[];
  date: string | null;
}

export interface Trigger {
  id: string;
  text: string;
  evidence: TriggerEvidence;
  sourceIds: string[];
}

export interface Alternative {
  providerId: string;
  kind: AltKind;
  why: string;
  directional?: boolean;
  riskDelta?: number | null;
}

export interface OhShitBox {
  blastRadius: "low" | "medium" | "high";
  paymentsContinue: string;
  subscriptionsMigrate: string;
  paymentDataPortable: string;
  fundsHeld: string;
  migrationDifficulty: string;
  emergencyAlternative: string;
  longTermAlternative: string;
}

export interface WhoFor {
  bestFor: string;
  thinkTwiceIf: string;
  backupRecommended: boolean;
  typicalMerchant: string;
}

export interface TimelineYear {
  year: number;
  note: string;
  count: number | null;
}

export interface Snapshot {
  holdsAllowed: YesNoVaries;
  reservesAllowed: YesNoVaries;
  terminationPowers: string;
  appealAvailable: YesNoVaries;
  /** @deprecated Prefer supportAccess. Kept as a derived compatibility field. */
  humanSupport: YesNoVaries;
  supportAccess?: SupportAccess;
  escalationQuality?: EscalationQuality;
  isMoR: boolean;
  directAcquiring: YesNoVaries;
  targetMerchant: string;
}

export interface OfficialCoverage {
  termination: boolean;
  holdsReserves: boolean;
  restricted: boolean;
  payouts: boolean;
  geography: boolean;
  appealSupport: boolean;
  officialSourceCount: number;
  comprehensiveAgreement: boolean;
  points: number;
  missing: string[];
}

export interface ConfidenceBreakdown {
  official: number;
  independent: number;
  recency: number;
  jurisdiction: number;
  diversity: number;
  contradiction: number;
  total: number;
  band: ConfidenceBand;
}

export interface ResearchDepth {
  officialSources: number;
  independentReports: number;
  jurisdictions: number;
  incidents: number;
  successfulResolutions: number;
  lastVerified: string;
  band: ResearchDepthBand;
}

export interface RubricPart {
  id: string;
  label: string;
  score: number;
  note: string;
}

export interface DimensionExplanation {
  key: keyof DimensionScores;
  score: number;
  bandLabel: string;
  bandText: string;
  parts: RubricPart[];
  official: { sourceId: string; title: string; finding: string }[];
  merchant: { incidentId: string; summary: string; outcome: string }[];
  counter: string[];
  calculated: number;
}

export interface Provider {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  legalName: string;
  headquarters: string;
  website: string;
  types: ProviderType[];
  regions: Region[];
  merchantCountries: string[];
  merchantCountriesNote: string;
  merchantCountriesSourced: boolean;
  currenciesNote: string;
  paymentMethods: string[];
  acquiringModel: string;
  isMoR: boolean;
  hasDirectMerchantAccount: YesNoVaries;
  isAggregator: boolean;
  underlyingAcquirers: string[];
  infrastructureNotes: string[];
  typicalMerchantSize: string[];
  focus: "sme" | "enterprise" | "both";
  supports: {
    digitalProducts: SupportLevel;
    saas: SupportLevel;
    ecommerce: SupportLevel;
    marketplace: SupportLevel;
    subscriptions: SupportLevel;
    highTicket: SupportLevel;
    physicalRetail: SupportLevel;
  };
  dimensions: DimensionScores;
  scores: Scores;
  /** Always published. Risk Index is not gated on research status. */
  publishedOverall: number;
  /** Always true. Kept so older call sites do not invent a second eligibility concept. */
  rankEligible: boolean;
  /** 1 through 50. Every canonical provider has a position. */
  rank: number;
  previousRank: number | null;
  /** Positive = moved toward #1 (riskier or others dropped). */
  rankDelta: number | null;
  confidence: number;
  confidenceBreakdown: ConfidenceBreakdown;
  researchStatus: ResearchStatus;
  researchDepth: ResearchDepth;
  officialCoverage: OfficialCoverage;
  lastVerified: string;
  badges: RiskFlags;
  snapshot: Snapshot;
  verdict: {
    short: string;
    cheekyLine: string;
  };
  whoFor: WhoFor;
  contract: OfficialFinding[];
  reportBuckets: ReportBucket[];
  incidents: Incident[];
  positiveOutcomes: PositiveOutcome[];
  triggers: Trigger[];
  ohShit: OhShitBox;
  alternatives: Alternative[];
  riskReduction: string[];
  timeline: TimelineYear[];
  timelineTrend: Trend;
  complaintVolumeNormalised: boolean;
  complaintVolumeNote: string;
  sourceIds: string[];
  dimensionExplanations: DimensionExplanation[];
  structuralNote: string | null;
}

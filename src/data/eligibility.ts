import type { OfficialCoverage, ResearchStatus } from "./types";
import type { ConfidenceBreakdown } from "./types";

export function researchTier(coverage: OfficialCoverage, confidence: ConfidenceBreakdown): ResearchStatus {
  const requiredOfficial =
    coverage.termination &&
    coverage.holdsReserves &&
    coverage.restricted &&
    coverage.geography &&
    coverage.appealSupport;
  const sourcesOk = coverage.officialSourceCount >= 3 || coverage.comprehensiveAgreement;

  if (confidence.total >= 70 && requiredOfficial && sourcesOk) return "verified";

  const lockoutCovered = coverage.termination || coverage.holdsReserves;
  if (confidence.total >= 50 && lockoutCovered && coverage.officialSourceCount >= 1) return "provisional";

  if (coverage.officialSourceCount >= 1 || confidence.total >= 30) return "in-research";
  return "pending";
}

export function researchStatusLabel(s: ResearchStatus): string {
  switch (s) {
    case "verified":
      return "Verified";
    case "provisional":
      return "Provisional";
    case "in-research":
      return "Research in progress";
    default:
      return "Research in progress";
  }
}

export function researchStatusShort(s: ResearchStatus): string {
  switch (s) {
    case "verified":
      return "Verified";
    case "provisional":
      return "Provisional";
    case "in-research":
      return "Research in progress";
    default:
      return "Research in progress";
  }
}

export function researchStatusHint(s: ResearchStatus): string {
  switch (s) {
    case "verified":
      return "Unusually strong evidence supporting this assessment.";
    case "provisional":
      return "Current best evidence-based assessment; important research gaps remain.";
    default:
      return "Based on a smaller body of evidence and may move as research continues.";
  }
}

export function typeContextNote(): string {
  return "Not all providers occupy the same layer of the payment stack. A gateway may score low on funds-hold exposure precisely because it does not control settlement. Lower risk does not automatically mean it is a drop-in replacement for another provider.";
}

export const TYPE_TABS: { id: string; label: string }[] = [
  { id: "all", label: "All types" },
  { id: "payment-aggregator", label: "Aggregators / PayFacs" },
  { id: "direct-acquirer", label: "Direct acquirers" },
  { id: "psp", label: "PSPs" },
  { id: "merchant-of-record", label: "Merchant of Record" },
  { id: "wallet", label: "Wallets" },
  { id: "gateway", label: "Gateways" },
  { id: "pay-by-bank", label: "Pay-by-bank" },
];

export const STATUS_TABS: { id: "all" | ResearchStatus; label: string }[] = [
  { id: "all", label: "All 50" },
  { id: "verified", label: "Verified evidence" },
  { id: "provisional", label: "Provisional" },
  { id: "in-research", label: "Research in progress" },
];

/** Optional leaderboard filter. Never the default. */
export const CONFIDENCE_TABS: { id: "all" | "high"; label: string }[] = [
  { id: "all", label: "All 50" },
  { id: "high", label: "High-confidence only" },
];

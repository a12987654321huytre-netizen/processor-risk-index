import type { Provider, Source } from "./types";
import { computeConfidence, researchDepth, uniqueIncidents } from "./confidence";
import { researchTier } from "./eligibility";
import { explainAll } from "./rubric";
import { SUPPORT_OVERRIDES, structuralNoteFor } from "./research/overrides";
import { COMMUNITY_INCIDENTS, COMMUNITY_POSITIVES, mergeIncidents } from "./research/incidents";
import { withScores } from "./scoring";
import { thinDimensions } from "./priors";
import { PREVIOUS_SNAPSHOT } from "./score-history";

function supportAccessFromLegacy(human: Provider["snapshot"]["humanSupport"]): Provider["snapshot"]["supportAccess"] {
  if (human === true) return "unknown";
  if (human === "varies") return "varies-by-plan";
  if (human === false) return "unknown";
  return "unknown";
}

export function enrichProvider(raw: Provider, sources: Source[]): Provider {
  const extraInc = COMMUNITY_INCIDENTS.filter((i) => i.providerId === raw.id);
  const extraPos = COMMUNITY_POSITIVES.filter((p) => p.sourceIds.some((id) => sources.some((s) => s.id === id && s.providerId === raw.id)));
  const incidents = uniqueIncidents(mergeIncidents(raw.incidents, extraInc));
  const positiveOutcomes = [
    ...raw.positiveOutcomes,
    ...extraPos.filter((p) => !raw.positiveOutcomes.some((e) => e.id === p.id)),
  ];
  const sourceIds = [...raw.sourceIds];
  for (const s of sources) {
    if (s.providerId === raw.id && !sourceIds.includes(s.id)) sourceIds.push(s.id);
  }
  for (const inc of extraInc) {
    for (const id of inc.sourceIds) if (!sourceIds.includes(id)) sourceIds.push(id);
  }

  const override = SUPPORT_OVERRIDES[raw.id];
  const snapshot = {
    ...raw.snapshot,
    humanSupport: override?.humanSupport ?? raw.snapshot.humanSupport,
    supportAccess: override?.supportAccess ?? raw.snapshot.supportAccess ?? supportAccessFromLegacy(raw.snapshot.humanSupport),
    escalationQuality: override?.escalationQuality ?? raw.snapshot.escalationQuality ?? "insufficient-evidence",
  };

  let contract = [...raw.contract];
  if (raw.id === "stripe" && !contract.some((f) => f.sourceId === "stripe-support-plans")) {
    contract.push({
      id: "stripe-support-plans-f0",
      topic: "support",
      title: "24×7 phone, email and chat for all customers",
      paraphrase:
        "Stripe’s support-plans page states that all customers receive 24×7 phone, email and chat help. Paid plans add priority routing and account managers — they are not what unlocks a human. Escalation quality on lockouts is scored separately.",
      sourceId: "stripe-support-plans",
      jurisdiction: "global",
    });
  }
  if (raw.id === "paypal" && !contract.some((f) => f.sourceId === "paypal-unable-services")) {
    contract.push({
      id: "paypal-unable-services-f0",
      topic: "termination",
      title: "Permanent limitation cannot be overturned",
      paraphrase:
        "PayPal’s US help article states a permanent limitation “can’t be overturned.” Funds are held 180 days to cover disputes; remaining balance can be withdrawn afterwards. This is the official version of the 180-day clock merchants describe.",
      sourceId: "paypal-unable-services",
      jurisdiction: "US",
    });
  }

  const merged: Provider = {
    ...raw,
    incidents,
    positiveOutcomes,
    sourceIds,
    snapshot,
    contract,
  };

  const providerSources = sources.filter((s) => merged.sourceIds.includes(s.id) || s.providerId === raw.id);
  const { breakdown, coverage } = computeConfidence(merged, providerSources);
  const depth = researchDepth(merged, providerSources, incidents, coverage);
  const scores = withScores(merged.dimensions);
  const status = researchTier(coverage, breakdown);
  const publishedOverall = scores.overall;
  const thin = thinDimensions(coverage.missing);
  const previous = PREVIOUS_SNAPSHOT[raw.id];
  const dimensionExplanations = explainAll(merged);
  const structural = structuralNoteFor(raw.id, raw.types);
  const notes = [...raw.infrastructureNotes];
  if (override?.note && !notes.includes(override.note)) notes.push(override.note);
  if (thin.length && !notes.some((n) => n.startsWith("Thin official evidence"))) {
    notes.push(
      `Thin official evidence on ${thin.join(", ")} — scored from available evidence; the gap is listed and Evidence Confidence is reduced. Rank still published.`,
    );
  }

  return {
    ...merged,
    infrastructureNotes: notes,
    confidence: breakdown.total,
    confidenceBreakdown: breakdown,
    officialCoverage: coverage,
    researchDepth: depth,
    researchStatus: status,
    rankEligible: true,
    publishedOverall,
    rank: 0,
    previousRank: previous?.rank ?? null,
    rankDelta: null,
    dimensionExplanations,
    structuralNote: structural,
    scores,
  };
}

export function enrichAll(raw: Provider[], sources: Source[]): Provider[] {
  const enriched = raw.map((p) => enrichProvider(p, sources));
  const ranked = [...enriched].sort(
    (a, b) => b.publishedOverall - a.publishedOverall || b.confidence - a.confidence || a.name.localeCompare(b.name),
  );
  const rankById = new Map(ranked.map((p, i) => [p.id, i + 1]));
  return enriched.map((p) => {
    const rank = rankById.get(p.id) ?? ranked.length;
    const previous = PREVIOUS_SNAPSHOT[p.id];
    const rankDelta = previous ? previous.rank - rank : null;
    return { ...p, rank, rankDelta };
  });
}

export function researchStats(providers: Provider[]) {
  const verified = providers.filter((p) => p.researchStatus === "verified").length;
  const provisional = providers.filter((p) => p.researchStatus === "provisional").length;
  const inResearch = providers.filter((p) => p.researchStatus === "in-research").length;
  const pending = providers.filter((p) => p.researchStatus === "pending").length;
  const highConfidence = providers.filter((p) => p.confidence >= 70).length;
  const mediumConfidence = providers.filter((p) => p.confidence >= 50 && p.confidence < 70).length;
  const lowConfidence = providers.filter((p) => p.confidence < 50).length;
  return {
    total: providers.length,
    ranked: providers.length,
    verified,
    provisional,
    inResearch,
    partial: inResearch,
    pending,
    unresearched: pending,
    researching: providers.length - verified,
    highConfidence,
    mediumConfidence,
    lowConfidence,
  };
}

import type { DimensionExplanation, DimensionScores, Incident, OfficialFinding, Provider, RubricPart } from "./types";

export const RUBRIC: Record<
  keyof DimensionScores,
  { label: string; parts: [string, string, string, string]; bands: { min: number; max: number; title: string; text: string }[] }
> = {
  suspension: {
    label: "Suspension & termination",
    parts: ["Contractual termination breadth", "Notice / cure", "Immediate-suspend power", "Closure incident pattern"],
    bands: [
      { min: 0, max: 1, title: "0–1", text: "Suspension almost entirely constrained to objective legal/contractual breach with substantial notice and cure." },
      { min: 2, max: 3, title: "2–3", text: "Traditional merchant relationship; defined termination powers; meaningful warning/cure process." },
      { min: 4, max: 5, title: "4–5", text: "Broader risk-based powers but generally structured underwriting and human review." },
      { min: 6, max: 7, title: "6–7", text: "Broad discretionary risk powers, immediate suspension possible, meaningful merchant reports." },
      { min: 8, max: 9, title: "8–9", text: "Very broad unilateral powers combined with substantial sudden-closure evidence." },
      { min: 10, max: 10, title: "10", text: "Exceptional dependency/intervention power plus an unusually severe, well-supported incident pattern." },
    ],
  },
  fundsHold: {
    label: "Funds hold & reserves",
    parts: ["Contractual reserve discretion", "Hold duration", "Incident severity", "Reversibility"],
    bands: [
      { min: 0, max: 1, title: "0–1", text: "No contractual right to hold card settlement; gateway or pass-through only." },
      { min: 2, max: 3, title: "2–3", text: "Limited, time-boxed reserves with a defined release; rare merchant reports." },
      { min: 4, max: 5, title: "4–5", text: "Standard acquiring reserves (often 90–180 days) with documented terms." },
      { min: 6, max: 7, title: "6–7", text: "Broad hold/reserve discretion; 90–180 day post-closure holds commonly reported." },
      { min: 8, max: 9, title: "8–9", text: "Unilateral indefinite or 180+ day holds, frequent severe cash-flow incidents." },
      { min: 10, max: 10, title: "10", text: "Routine multi-month freezes with weak release rights and a high-severity pattern." },
    ],
  },
  underwriting: {
    label: "Underwriting predictability",
    parts: ["When review happens", "Approval revocability", "KYC friction", "Growth sensitivity"],
    bands: [
      { min: 0, max: 1, title: "0–1", text: "Full underwriting before processing; terms rarely change silently." },
      { min: 2, max: 3, title: "2–3", text: "Traditional merchant onboarding; reviews are scheduled and explained." },
      { min: 4, max: 5, title: "4–5", text: "Mix of up-front KYC and later monitoring; humans in the loop for mid-market." },
      { min: 6, max: 7, title: "6–7", text: "Instant onboarding; material risk review happens after you already depend on them." },
      { min: 8, max: 9, title: "8–9", text: "Approval explicitly revocable anytime; growth or model change commonly triggers a freeze." },
      { min: 10, max: 10, title: "10", text: "Effectively continuous re-underwriting with an opaque automated kill-switch." },
    ],
  },
  appeal: {
    label: "Appeal & support",
    parts: ["Support access", "Escalation quality", "Documented reinstatements", "Template-denial pattern"],
    bands: [
      { min: 0, max: 1, title: "0–1", text: "Named account managers, a contractual appeal path, and documented reinstatements." },
      { min: 2, max: 3, title: "2–3", text: "Human support with a real escalation path and mixed but real wins." },
      { min: 4, max: 5, title: "4–5", text: "Phone/chat exists; lockout decisions are still slow and uneven." },
      { min: 6, max: 7, title: "6–7", text: "Access exists, but lockout appeals are templated; reinstatement is rare." },
      { min: 8, max: 9, title: "8–9", text: "Ticket-only or unreachable during a freeze; almost no documented wins." },
      { min: 10, max: 10, title: "10", text: "No practical appeal; decisions described as final in the contract and in reports." },
    ],
  },
  policy: {
    label: "Policy breadth & clarity",
    parts: ["Restricted-list breadth", "Catch-all language", "Clarity", "Revocation of prior approval"],
    bands: [
      { min: 0, max: 1, title: "0–1", text: "Narrow, specific prohibited list; changes noticed; prior approval respected." },
      { min: 2, max: 3, title: "2–3", text: "Standard card-network prohibited list, clearly published." },
      { min: 4, max: 5, title: "4–5", text: "Broader restricted list with a diligence path." },
      { min: 6, max: 7, title: "6–7", text: "Long restricted list plus vague catch-alls; prior approval can be withdrawn." },
      { min: 8, max: 9, title: "8–9", text: "Catch-all moral or reputational clauses used as a kill-switch." },
      { min: 10, max: 10, title: "10", text: "Policy is effectively “we can decide later,” with a history of moving the goalposts." },
    ],
  },
  incidents: {
    label: "Merchant incident pattern",
    parts: ["Independence of reports", "Severity mix", "Recency", "Merchant-responsibility filter"],
    bands: [
      { min: 0, max: 1, title: "0–1", text: "No independent pattern after a serious search, or only merchant-at-fault cases." },
      { min: 2, max: 3, title: "2–3", text: "Isolated reports, mostly reversed, not a pattern." },
      { min: 4, max: 5, title: "4–5", text: "Recurring reports, mixed severity, popularity-bias noted." },
      { min: 6, max: 7, title: "6–7", text: "Repeated independent reports of closures or holds across years." },
      { min: 8, max: 9, title: "8–9", text: "Dense recent pattern including high-severity, low-responsibility cases." },
      { min: 10, max: 10, title: "10", text: "Exceptional, well-documented harm pattern. Do not award lightly." },
    ],
  },
  dependency: {
    label: "Platform dependency",
    parts: ["Token portability", "Checkout coupling", "Subscription coupling", "MoR / single-stack risk"],
    bands: [
      { min: 0, max: 1, title: "0–1", text: "Portable MID, tokens you control, easy dual-processing." },
      { min: 2, max: 3, title: "2–3", text: "Merchant account with some switching friction." },
      { min: 4, max: 5, title: "4–5", text: "PSP with exportable tokens if you ask while healthy." },
      { min: 6, max: 7, title: "6–7", text: "Aggregator checkout and billing coupling; a backup is real work." },
      { min: 8, max: 9, title: "8–9", text: "Wallet, platform, or MoR where the customer relationship is theirs." },
      { min: 10, max: 10, title: "10", text: "Full stack — checkout, tax, subscriptions, payouts — on one MoR or platform." },
    ],
  },
};

export function rubricBand(key: keyof DimensionScores, score: number) {
  const bands = RUBRIC[key].bands;
  return bands.find((b) => score >= b.min && score <= b.max) ?? bands[bands.length - 1];
}

/** Four half-point parts that average back to the dimension. Decimals come from this split, not from typing 7.2. */
export function splitIntoFour(n: number): [number, number, number, number] {
  const totalHalves = Math.round(n * 8);
  const base = Math.floor(totalHalves / 4);
  const rem = totalHalves % 4;
  return [0, 1, 2, 3].map((i) => (base + (i < rem ? 1 : 0)) / 2) as [number, number, number, number];
}

export function formatDimension(n: number): { text: string; precise: boolean } {
  const rounded = Math.round(n * 10) / 10;
  if (Math.abs(rounded - Math.round(rounded)) < 0.05) {
    return { text: `${Math.round(rounded)} / 10`, precise: false };
  }
  return { text: rounded.toFixed(1), precise: true };
}

const TOPIC_FOR: Record<keyof DimensionScores, OfficialFinding["topic"][]> = {
  suspension: ["suspension", "termination"],
  fundsHold: ["funds-holds", "reserves", "payouts"],
  underwriting: ["verification", "restricted-businesses"],
  appeal: ["support", "appeal"],
  policy: ["restricted-businesses"],
  incidents: [],
  dependency: ["other"],
};

const RESTORED: Incident["outcome"][] = [
  "restored-automatically",
  "restored-after-documents",
  "restored-after-appeal",
  "restored-after-escalation",
  "funds-released",
  "partially-restored",
  "reserve-removed",
];

export function explainDimension(
  key: keyof DimensionScores,
  score: number,
  contract: OfficialFinding[],
  incidents: Incident[],
  positives: { summary: string }[],
  isMoR: boolean,
  isGateway: boolean,
): DimensionExplanation {
  const meta = RUBRIC[key];
  const band = rubricBand(key, score);
  const halves = splitIntoFour(score);
  const parts: RubricPart[] = meta.parts.map((label, i) => ({
    id: `${key}-${i}`,
    label,
    score: halves[i],
    note: i === 0 ? band.text : "",
  }));
  const calculated = Math.round((halves.reduce((a, b) => a + b, 0) / 4) * 10) / 10;
  const topics = TOPIC_FOR[key];
  const official = contract
    .filter((f) => topics.includes(f.topic) || (key === "appeal" && /appeal|support|supervisor|reinstate/i.test(f.title + f.paraphrase)))
    .slice(0, 4)
    .map((f) => ({ sourceId: f.sourceId, title: f.title, finding: f.paraphrase }));

  const merchant = incidents
    .filter((inc) => {
      if (key === "fundsHold") return /hold|reserve|payout|funds/i.test(inc.incidentType + inc.summary);
      if (key === "suspension") return /suspension|termination|closed|limited/i.test(inc.incidentType + inc.summary);
      if (key === "appeal") return RESTORED.includes(inc.outcome) || /appeal|reinstate|support/i.test(inc.summary);
      if (key === "underwriting") return /kyc|review|volume|verification/i.test(inc.incidentType + inc.summary);
      if (key === "incidents") return true;
      return false;
    })
    .slice(0, 5)
    .map((inc) => ({ incidentId: inc.id, summary: inc.summary, outcome: inc.outcome }));

  const counter: string[] = [];
  if (key === "incidents" || key === "appeal") {
    for (const p of positives.slice(0, 3)) counter.push(p.summary);
  }
  const restored = incidents.filter((i) => RESTORED.includes(i.outcome));
  if ((key === "fundsHold" || key === "appeal") && restored.length) {
    counter.push(`${restored.length} logged incident(s) later released funds or restored access. Reversals are not scored like permanent closures.`);
  }
  if (key === "fundsHold" && isGateway) {
    counter.push("Gateway structural note: this provider typically does not control card settlement, so funds-hold exposure is not equivalent to an acquirer.");
  }
  if (key === "dependency" && isMoR) {
    counter.push("Merchant of Record: tax and invoicing may get easier. Platform dependency usually gets worse.");
  }

  return {
    key,
    score,
    bandLabel: band.title,
    bandText: band.text,
    parts,
    official,
    merchant,
    counter,
    calculated,
  };
}

export function explainAll(p: {
  dimensions: DimensionScores;
  contract: OfficialFinding[];
  incidents: Incident[];
  positiveOutcomes: { summary: string }[];
  isMoR: boolean;
  types: string[];
}): DimensionExplanation[] {
  const keys = Object.keys(RUBRIC) as (keyof DimensionScores)[];
  const isGateway = p.types.includes("gateway");
  return keys.map((k) => explainDimension(k, p.dimensions[k], p.contract, p.incidents, p.positiveOutcomes, p.isMoR, isGateway));
}

import type { DimensionScores, ProviderType } from "./types";

/**
 * Documented type baselines for missing official evidence.
 *
 * Used when a lockout clause is unpublished. The dimension is not left blank
 * and is not secretly invented: it is pulled toward this prior, Evidence
 * Confidence falls, and the dossier lists the gap.
 *
 * Neutral prior on the 0–10 scale is 5. Type baselines replace the neutral
 * prior where architecture is known (a gateway does not sit in settlement;
 * a MoR couples checkout + tax + payouts).
 */
export const NEUTRAL_PRIOR = 5;

export const TYPE_BASELINES: Record<string, DimensionScores> = {
  "payment-aggregator": {
    suspension: 6.5,
    fundsHold: 6.5,
    underwriting: 6.0,
    appeal: 5.5,
    policy: 6.0,
    incidents: 4.0,
    dependency: 6.5,
  },
  "direct-acquirer": {
    suspension: 5.0,
    fundsHold: 5.5,
    underwriting: 4.5,
    appeal: 4.0,
    policy: 5.0,
    incidents: 3.5,
    dependency: 4.5,
  },
  psp: {
    suspension: 5.5,
    fundsHold: 5.5,
    underwriting: 5.0,
    appeal: 4.5,
    policy: 5.5,
    incidents: 3.5,
    dependency: 5.0,
  },
  gateway: {
    suspension: 4.0,
    fundsHold: 3.0,
    underwriting: 4.0,
    appeal: 4.0,
    policy: 4.0,
    incidents: 2.5,
    dependency: 3.5,
  },
  wallet: {
    suspension: 6.5,
    fundsHold: 6.0,
    underwriting: 6.0,
    appeal: 6.5,
    policy: 7.0,
    incidents: 3.5,
    dependency: 7.5,
  },
  "merchant-of-record": {
    suspension: 6.5,
    fundsHold: 6.5,
    underwriting: 6.0,
    appeal: 5.5,
    policy: 6.5,
    incidents: 4.0,
    dependency: 7.5,
  },
  "pay-by-bank": {
    suspension: 5.0,
    fundsHold: 4.5,
    underwriting: 5.0,
    appeal: 4.5,
    policy: 5.0,
    incidents: 3.0,
    dependency: 4.5,
  },
  "platform-payments": {
    suspension: 7.0,
    fundsHold: 6.5,
    underwriting: 6.0,
    appeal: 6.0,
    policy: 6.0,
    incidents: 4.0,
    dependency: 8.0,
  },
  "merchant-account-provider": {
    suspension: 5.0,
    fundsHold: 5.5,
    underwriting: 4.5,
    appeal: 4.0,
    policy: 5.0,
    incidents: 3.5,
    dependency: 4.5,
  },
  "alternative-payment-method": {
    suspension: 6.5,
    fundsHold: 6.0,
    underwriting: 6.5,
    appeal: 6.5,
    policy: 7.0,
    incidents: 3.0,
    dependency: 7.0,
  },
  hybrid: {
    suspension: 6.0,
    fundsHold: 6.0,
    underwriting: 5.5,
    appeal: 5.0,
    policy: 5.5,
    incidents: 3.5,
    dependency: 5.5,
  },
};

export function baselineFor(types: ProviderType[]): DimensionScores {
  const primary = types[0] ?? "psp";
  return TYPE_BASELINES[primary] ?? TYPE_BASELINES.psp;
}

export type ThinDimension = keyof DimensionScores;

/** Which overall dimensions rest on thinner official evidence. */
export function thinDimensions(missing: string[]): ThinDimension[] {
  const out = new Set<ThinDimension>();
  for (const m of missing) {
    if (/terminat|suspen/.test(m)) out.add("suspension");
    if (/hold|reserve|payout/.test(m)) out.add("fundsHold");
    if (/restrict/.test(m)) out.add("policy");
    if (/support|appeal/.test(m)) out.add("appeal");
    if (/geograph/.test(m)) out.add("underwriting");
  }
  return [...out];
}

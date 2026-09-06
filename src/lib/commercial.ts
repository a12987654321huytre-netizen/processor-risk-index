/**
 * COMMERCIAL DATA — keep this module out of the research engine.
 *
 * src/data/scoring.ts, src/data/alternatives.ts, src/data/enrich.ts
 * and src/data/confidence.ts must never import this file.
 *
 * They can buy an ad. They cannot buy a better score.
 */

export const COMMERCIAL_FIREWALL =
  "They can buy an ad. They cannot buy a better score.";

export const REFERRAL_DISCLOSURE =
  "PRI may receive a referral fee if you become a customer. This does not affect scores or rankings.";

export type ReferralOffer = {
  providerId: string;
  cta: "Apply" | "Talk to sales";
  url: string;
};

/** Empty until a real partner programme is signed. Ranking code cannot read this. */
export const REFERRALS: ReferralOffer[] = [];

export function referralFor(_providerId: string): ReferralOffer | null {
  return null;
}

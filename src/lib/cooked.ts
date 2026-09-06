import type { Provider } from "@/data/types";
import { getProvider, infraWarnings } from "@/data";
import { bandFor } from "@/data/scoring";

export type CookedInput = {
  processorId: string;
  country: string;
  industry: string;
  product: "digital" | "physical" | "service";
  volume: "under-10k" | "10k-50k" | "50k-250k" | "250k-1m" | "over-1m";
  aov: "under-50" | "50-200" | "200-1k" | "1k-5k" | "over-5k";
  largest: "under-500" | "500-2k" | "2k-10k" | "over-10k";
  chargebacks: "unknown" | "under-0.5" | "0.5-1" | "over-1";
  refunds: "unknown" | "under-5" | "5-15" | "over-15";
  accountAge: "under-3m" | "3-12m" | "over-12m";
  growth: "flat" | "steady" | "spike";
  fulfilment: "immediate" | "under-7d" | "over-7d";
  subscription: boolean;
  crossBorder: boolean;
  backupId: string; // "" or processor id
};

export type CookedResult = {
  score: number;
  bandLabel: string;
  cheeky: string;
  observations: string[];
  fixes: string[];
  processor: Provider;
};

export function evaluateCooked(input: CookedInput): CookedResult | null {
  const p = getProvider(input.processorId);
  if (!p) return null;
  let score = p.scores.overall;
  const observations: string[] = [];
  const fixes: string[] = [];

  observations.push(
    `${p.name} scores ${p.scores.overall} on the lockout index (${bandFor(p.scores.overall)?.label ?? "n/a"}). That is the processor. The rest is how you use it.`,
  );

  if (!input.backupId) {
    score += 12;
    observations.push(
      `No backup processor is connected. ${p.name} is not the entire problem — 100% of revenue through one account is.`,
    );
    fixes.push("Connect a backup card processor while this account is healthy.");
  } else {
    const b = getProvider(input.backupId);
    const warn = infraWarnings([p.id, input.backupId]);
    if (warn.length) {
      score += 8;
      observations.push(warn[0].warning);
      fixes.push("Pick a backup that is not the same underlying family (Stripe/Shopify/Lemon, PayPal/Braintree, Elavon/Helcim, Mollie/GoCardless).");
    } else if (b) {
      observations.push(`Backup on file: ${b.name} (index ${b.scores.overall}). Confirm it is actually live, not a half-finished signup.`);
    }
  }

  if (input.product === "digital" && (p.badges.digitalGoods === "high" || p.badges.digitalGoods === "very-high")) {
    score += 6;
    observations.push("Digital goods on a processor with elevated digital-goods sensitivity. Delivery logs matter more than your refund policy blog post.");
    fixes.push("Keep download/login/fulfilment evidence. Match the catalogue you described at onboarding.");
  }

  if ((input.aov === "1k-5k" || input.aov === "over-5k" || input.largest === "2k-10k" || input.largest === "over-10k") &&
      (p.badges.highTicket === "high" || p.badges.highTicket === "very-high" || p.dimensions.underwriting >= 6)) {
    score += 5;
    observations.push("High-ticket or large single charges on an account with elevated underwriting/high-ticket flags.");
    fixes.push("Tell the processor before unusual tickets. Do not land the first $10k charge on a quiet MID.");
  }

  if (input.accountAge === "under-3m" && (input.volume === "50k-250k" || input.volume === "250k-1m" || input.volume === "over-1m" || input.growth === "spike")) {
    score += 7;
    observations.push("New account plus meaningful volume or a spike is the classic post-onboarding review pattern.");
    fixes.push("Ramp volume in line with the description you gave underwriting. Keep cash outside the processor.");
  } else if (input.growth === "spike") {
    score += 4;
    observations.push("Sudden growth is a documented review trigger on several aggregator help centres.");
  }

  if (input.subscription && p.isMoR) {
    score += 6;
    observations.push("Subscriptions on a Merchant of Record. Customers contracted with them. A shutdown is a re-sale, not an export.");
    fixes.push("Run a share of new checkouts on a direct (non-MoR) processor.");
  } else if (input.subscription && p.dimensions.dependency >= 6) {
    score += 3;
    observations.push("Recurring billing plus elevated platform dependency. Ask, in writing, whether tokens can leave.");
  }

  if (input.crossBorder && (p.badges.crossBorder === "high" || p.badges.crossBorder === "very-high")) {
    score += 3;
    observations.push("Cross-border collecting on a processor where corridor complexity is part of the dossier.");
  }

  if (input.country && p.merchantCountries.length && !p.merchantCountries.includes(input.country)) {
    score += 4;
    observations.push(
      `${input.country} is not in the sourced merchant-country list for ${p.name}. Confirm onboarding on the provider’s own country page — PRI does not guess availability.`,
    );
    fixes.push("Do not treat ‘customers can pay from this country’ as ‘you can open a merchant account here’.");
  }

  if (input.chargebacks === "over-1") {
    score += 6;
    observations.push("Chargeback rate above 1% is inside several processors’ documented intervention territory.");
    fixes.push("Fix descriptor, fulfilment and refunds before the processor does it with a reserve.");
  }

  if (input.fulfilment === "over-7d") {
    score += 3;
    observations.push("Delayed fulfilment looks like uncompleted-order exposure. Some aggregators restrict future-dated business.");
  }

  if (p.snapshot.holdsAllowed === true) {
    observations.push(`Contractual holds/reserves are allowed. ${p.ohShit.fundsHeld}`);
    fixes.push("Hold operating cash outside the processor so a payout pause is not existential.");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const band = bandFor(score);
  const uniqFixes = [...new Set(fixes)].slice(0, 6);
  if (!uniqFixes.some((f) => /backup/i.test(f))) uniqFixes.unshift("Keep a second live processor and a bank-payment rail that is not the same company.");
  uniqFixes.push("Keep KYC documents current. Do not hide activity from compliance systems.");

  return {
    score,
    bandLabel: band?.label ?? "Moderate",
    cheeky: band?.cheeky ?? "Have a backup",
    observations: observations.slice(0, 8),
    fixes: uniqFixes.slice(0, 6),
    processor: p,
  };
}

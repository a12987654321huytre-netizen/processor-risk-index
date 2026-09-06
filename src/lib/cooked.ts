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
  backupId: string;
  independentRail: boolean;
  revenueShare: "all" | "most" | "half" | "minor";
  cashBuffer: "under-1m" | "1-3m" | "over-3m";
};

export type ExposureId = "low" | "moderate" | "elevated" | "high";

export type CookedResult = {
  providerRisk: number;
  exposure: number;
  score: number;
  bandLabel: string;
  cheeky: string;
  signature: string;
  observations: string[];
  fixes: string[];
  processor: Provider;
  exposureId: ExposureId;
};

export function exposureBand(n: number): { id: ExposureId; label: string; cheeky: string } {
  if (n <= 34) return { id: "low", label: "Low exposure", cheeky: "Good setup. Keep it boring." };
  if (n <= 54) return { id: "moderate", label: "Moderate exposure", cheeky: "No immediate drama here." };
  if (n <= 69) return { id: "elevated", label: "Elevated exposure", cheeky: "A backup is sensible, not an evacuation order." };
  return { id: "high", label: "High exposure", cheeky: "Worth planning around." };
}

export function evaluateCooked(input: CookedInput): CookedResult | null {
  const p = getProvider(input.processorId);
  if (!p) return null;
  const providerRisk = p.publishedOverall;
  let exposure = providerRisk;
  const observations: string[] = [];
  const fixes: string[] = [];
  const hasBackup = Boolean(input.backupId);
  const hasRail = input.independentRail;

  observations.push(
    `Provider risk: ${providerRisk}/100 (${bandFor(providerRisk)?.label ?? "n/a"}, #${p.rank} of 50). That is the processor. Your exposure is how much of the business sits on it. Evidence confidence ${p.confidence}/100 (${p.researchStatus}).`,
  );

  if (input.revenueShare === "all") {
    exposure += 18;
    if (!hasBackup) {
      observations.push("100% of revenue through one provider. The processor isn’t the scariest part. Your dependency is.");
      fixes.push("Move a slice of new volume to a second live processor while this account is healthy.");
    } else {
      observations.push("Most of the volume still sits here. The backup is the important part — keep it tested.");
    }
  } else if (input.revenueShare === "most") {
    exposure += 10;
    observations.push("Most revenue on one account. A payout pause still hits payroll.");
  } else if (input.revenueShare === "half") {
    exposure += 4;
  } else {
    observations.push("Minor share on this processor. Blast radius is smaller — still check token portability.");
  }

  if (!hasBackup) {
    exposure += 12;
    observations.push(`No backup processor is connected. ${p.name} is not the entire problem — one account is.`);
    fixes.push("Connect a backup card processor while this account is healthy.");
  } else {
    const b = getProvider(input.backupId);
    const warn = infraWarnings([p.id, input.backupId]);
    if (warn.length) {
      exposure += 10;
      observations.push(warn[0].warning);
      observations.push("These aren't as independent as they look.");
      fixes.push("Pick a backup that is not the same underlying family.");
    } else if (b) {
      observations.push(
        `Backup on file: ${b.name} (index ${b.publishedOverall}, #${b.rank}). Confirm it is actually live, not a half-finished signup.`,
      );
    }
  }

  if (!hasRail) {
    exposure += 4;
    observations.push("No independent payment rail. Another card processor is useful. Another rail is better.");
    fixes.push("Add a pay-by-bank or local rail that does not share this processor's infrastructure.");
  } else {
    observations.push("Independent rail on file. That is real diversification, if it is actually live.");
  }

  if (input.cashBuffer === "under-1m") {
    exposure += 8;
    observations.push("Under a month of operating cash outside the processor. A long payout pause then hits the company, not just the dashboard.");
    fixes.push("Hold operating cash outside the processor so a payout pause is not the whole company.");
  } else if (input.cashBuffer === "over-3m") {
    exposure -= 4;
  }

  if (input.product === "digital" && (p.badges.digitalGoods === "high" || p.badges.digitalGoods === "very-high")) {
    exposure += 6;
    observations.push("Digital goods on a processor with elevated digital-goods sensitivity. Delivery logs matter more than your refund policy blog post.");
    fixes.push("Keep download/login/fulfilment evidence. Match the catalogue you described at onboarding.");
  }

  if (
    (input.aov === "1k-5k" || input.aov === "over-5k" || input.largest === "2k-10k" || input.largest === "over-10k") &&
    (p.badges.highTicket === "high" || p.badges.highTicket === "very-high" || p.dimensions.underwriting >= 6)
  ) {
    exposure += 5;
    observations.push("High-ticket or large single charges on an account with elevated underwriting/high-ticket flags.");
    fixes.push("Tell the processor before unusual tickets. Do not land the first $10k charge on a quiet MID.");
  }

  if (input.accountAge === "under-3m" && (input.volume === "50k-250k" || input.volume === "250k-1m" || input.volume === "over-1m" || input.growth === "spike")) {
    exposure += 7;
    observations.push("New account plus meaningful volume or a spike is the classic post-onboarding review pattern.");
    fixes.push("Ramp volume in line with the description you gave underwriting. Keep cash outside the processor.");
  } else if (input.growth === "spike") {
    exposure += 4;
    observations.push("Sudden growth is a documented review trigger on several aggregator help centres.");
  }

  if (input.subscription && p.isMoR) {
    exposure += 6;
    observations.push("Subscriptions on a Merchant of Record. Customers contracted with them. Leaving is a re-sale, not an export.");
    fixes.push("Run a share of new checkouts on a direct (non-MoR) processor.");
  } else if (input.subscription && p.dimensions.dependency >= 6) {
    exposure += 3;
    observations.push("Recurring billing plus elevated platform dependency. Ask, in writing, whether tokens can leave.");
  }

  if (input.crossBorder && (p.badges.crossBorder === "high" || p.badges.crossBorder === "very-high")) {
    exposure += 3;
    observations.push("Cross-border collecting on a processor where corridor complexity is part of the dossier.");
  }

  if (input.country && p.merchantCountries.length && !p.merchantCountries.includes(input.country)) {
    exposure += 4;
    observations.push(
      `${input.country} is not in the sourced merchant-country list for ${p.name}. Confirm onboarding on the provider’s own country page — PRI does not guess availability.`,
    );
    fixes.push("Do not treat ‘customers can pay from this country’ as ‘you can open a merchant account here’.");
  }

  if (input.chargebacks === "over-1") {
    exposure += 6;
    observations.push("Chargeback rate above 1% is inside several processors’ documented intervention territory.");
    fixes.push("Fix descriptor, fulfilment and refunds before the processor does it with a reserve.");
  }

  if (input.fulfilment === "over-7d") {
    exposure += 3;
    observations.push("Delayed fulfilment looks like uncompleted-order exposure. Some aggregators restrict future-dated business.");
  }

  if (p.snapshot.holdsAllowed === true) {
    observations.push(`Contractual holds/reserves are allowed. ${p.ohShit.fundsHeld}`);
    if (input.cashBuffer === "under-1m") {
      fixes.push("Hold operating cash outside the processor so a payout pause is not the whole company.");
    }
  }

  if (hasBackup) {
    const b = getProvider(input.backupId);
    const warn = b ? infraWarnings([p.id, input.backupId]) : [];
    if (b && !warn.length) exposure -= 6;
  }
  if (hasRail) exposure -= 4;

  exposure = Math.max(0, Math.min(100, Math.round(exposure)));
  const diversified = input.revenueShare === "half" || input.revenueShare === "minor";
  const cashOk = input.cashBuffer !== "under-1m";
  const resilient = hasBackup && (hasRail || diversified) && cashOk;
  const exp = exposureBand(exposure);

  const uniqFixes = [...new Set(fixes)].slice(0, 6);
  if (!hasBackup && !uniqFixes.some((f) => /backup/i.test(f))) {
    uniqFixes.unshift("Connect a second live processor and a bank-payment rail that is not the same company.");
  }
  if (hasBackup && hasRail && uniqFixes.length === 0) {
    uniqFixes.push("Keep the backup tested. A dormant signup is not a rail.");
  }
  uniqFixes.push("Keep KYC documents current. Do not hide activity from compliance systems.");

  let signature: string;
  if (resilient && exposure <= 50) signature = "You're actually in decent shape.";
  else if (resilient || (hasBackup && hasRail && exposure < 80))
    signature = "Your processor risk is elevated, but your setup is resilient.";
  else if (hasBackup && exposure <= 55) signature = "Good redundancy. Keep it boring.";
  else if (exposure <= 40) signature = "No immediate drama here.";
  else if (input.revenueShare === "all" && !hasBackup) signature = "Your processor isn't the scary bit. Your dependency is.";
  else if (exposure >= 80) signature = "You're pretty cooked.";
  else if (!hasBackup) signature = "Backup processor: cheaper than a nervous breakdown.";
  else signature = "Nothing dramatic here — just keep the backup tested.";

  if (resilient) observations.unshift("Good redundancy. Keep it boring.");
  else if (hasBackup && hasRail) observations.unshift("You've got another rail. Good.");

  return {
    providerRisk,
    exposure,
    score: exposure,
    bandLabel: exp.label,
    cheeky: exp.cheeky,
    signature,
    observations: observations.slice(0, 8),
    fixes: uniqFixes.slice(0, 6),
    processor: p,
    exposureId: exp.id,
  };
}

import type { Provider } from "./types";
import { bandFor } from "./scoring";

/** Evidence-backed positives only. Empty is allowed — we do not invent compliments. */
export function reassureItems(p: Provider): string[] {
  const items: string[] = [];

  if (p.snapshot.supportAccess === "24-7-phone-chat-email") {
    items.push("Documented 24/7 phone, chat and email. Access exists even if lockout appeals are still uneven.");
  } else if (p.snapshot.supportAccess === "phone-available") {
    items.push("Phone support is documented — not ticket-only.");
  } else if (p.snapshot.supportAccess === "account-manager-qualifying") {
    items.push("Named account managers exist for qualifying merchants.");
  } else if (p.snapshot.humanSupport === true) {
    items.push("Human support is documented on this account type.");
  }

  if (p.snapshot.escalationQuality === "good") {
    items.push("Escalation quality is sourced as good — humans in the loop, not just templates.");
  } else if (p.snapshot.escalationQuality === "mixed") {
    items.push("Escalation exists. Outcomes are mixed, which is still better than none.");
  }

  if (p.snapshot.appealAvailable === true) {
    items.push("The sourced terms describe an appeal or review path.");
  }

  if (p.positiveOutcomes.length) {
    items.push(
      `${p.positiveOutcomes.length} documented case${p.positiveOutcomes.length === 1 ? "" : "s"} where funds were released or access was restored.`,
    );
  } else if (p.researchDepth.successfulResolutions > 0) {
    items.push("The dossier records successful resolutions, not only closures.");
  }

  if (p.snapshot.directAcquiring === true || p.types.includes("direct-acquirer")) {
    items.push("Direct acquiring relationship — closer to a bank MID than to a wallet.");
  }
  if (p.hasDirectMerchantAccount === true) {
    items.push("A direct merchant account is available. That is usually easier to leave than a pure aggregator.");
  }

  if (p.snapshot.holdsAllowed === false) {
    items.push("No contractual right to hold card settlement showed up in the sourced terms.");
  } else if (p.snapshot.reservesAllowed === false) {
    items.push("No reserve clause in the sourced merchant terms.");
  } else if (p.snapshot.holdsAllowed === true && /90|120|180|defined|rolling/i.test(p.ohShit.fundsHeld)) {
    items.push("Reserve / hold rules are at least described. Predictable (even if long) is better than silent.");
  }

  if (p.dimensions.underwriting <= 3.5) {
    items.push("Underwriting is relatively front-loaded. Review happens before you already depend on them.");
  }
  if (p.dimensions.policy <= 3.5) {
    items.push("Restricted-business list is relatively specific, not a catch-all moral clause.");
  }
  if (p.dimensions.dependency <= 3.5) {
    items.push("Platform dependency is limited — dual-processing is more realistic here.");
  }
  if (p.dimensions.appeal <= 3) {
    items.push("Appeal and support sit in the calmer half of the index.");
  }

  if (/medium|high|yes|portable|export/i.test(p.ohShit.paymentDataPortable) && !/^low/i.test(p.ohShit.paymentDataPortable)) {
    items.push("Payment data / tokens are described as portable while the account is healthy.");
  }

  if (p.officialCoverage.missing.length === 0 && p.officialCoverage.officialSourceCount >= 3) {
    items.push("Official documentation coverage is strong. The score is not a Reddit mood.");
  }

  if (p.timeline.length >= 4) {
    items.push("Long operating history is on the timeline. Longevity is not a lockout waiver, but it is a real counterweight.");
  }

  const mainstream =
    p.supports.ecommerce === "yes" &&
    (p.supports.saas === "yes" || p.supports.physicalRetail === "yes") &&
    p.whoFor.typicalMerchant.length > 0;
  if (mainstream && p.publishedOverall < 80) {
    items.push(`Mainstream fit: ${p.whoFor.typicalMerchant}. A lot of ordinary shops live here without drama.`);
  }

  return unique(items).slice(0, 6);
}

export function goodChoice(p: Provider): { summary: string; fits: string[]; caution: string } {
  const fits: string[] = [];
  if (p.supports.ecommerce === "yes") fits.push("mainstream ecommerce");
  if (p.supports.saas === "yes") fits.push("SaaS");
  if (p.supports.subscriptions === "yes") fits.push("subscriptions");
  if (p.supports.physicalRetail === "yes") fits.push("physical retail");
  if (p.supports.marketplace === "yes") fits.push("marketplaces");
  if (p.supports.digitalProducts === "yes") fits.push("digital products");
  if (p.supports.highTicket === "yes") fits.push("high-ticket");
  if (p.focus === "sme" || p.focus === "both") fits.push("SMBs");
  if (p.focus === "enterprise" || p.focus === "both") fits.push("enterprise");
  return {
    summary: p.whoFor.bestFor,
    fits,
    caution: p.whoFor.thinkTwiceIf,
  };
}

/** Quality + trade-off + dependency. Not an accusation. */
export function balancedVerdict(p: Provider): string {
  const band = bandFor(p.publishedOverall);
  const fit = p.whoFor.typicalMerchant || "online businesses";
  const trade = topTradeoff(p);
  const name = p.name;
  const thin =
    p.confidence < 50
      ? " Evidence confidence is still thin, so treat the number as directional."
      : "";

  switch (band?.id) {
    case "low":
    case "guarded":
      return `${name} is a relatively easy processor to live with for ${fit}. The ${band.label.toLowerCase()} score reflects ${trade} — fewer nasty surprises than the top of this list, not a gold star.${thin}`;
    case "moderate":
      return `${name} is a usable fit for ${fit}. The moderate score is a trade-off: ${trade}. Concentration still matters more than the logo.${thin}`;
    case "elevated":
      return `${name} is a strong fit for ${fit}. PRI’s elevated score reflects ${trade}, not a claim that ${name} is inherently unsafe.${thin}`;
    case "high":
      return `${name} remains widely used for ${fit}. The high score is about ${trade} — understand the trade-off, then decide whether a backup is already enough.${thin}`;
    case "severe":
      return `${name} is still a product people choose for ${fit}. The severe score is about ${trade}. That is a dependency problem to design around, not a moral verdict.${thin}`;
    default:
      return `${name} is used by ${fit}. ${trade}.${thin}`;
  }
}

function topTradeoff(p: Provider): string {
  const dims: [number, string][] = [
    [p.dimensions.suspension, "broad termination powers"],
    [p.dimensions.fundsHold, "funds-hold / reserve discretion"],
    [p.dimensions.underwriting, "post-onboarding review exposure"],
    [p.dimensions.appeal, "appeal friction"],
    [p.dimensions.policy, "policy breadth"],
    [p.dimensions.dependency, "how hard it is to leave"],
  ];
  dims.sort((a, b) => b[0] - a[0]);
  return `${dims[0][1]} and ${dims[1][1]}`;
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

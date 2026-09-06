import type { AltKind, Alternative, Provider } from "./types";
import type { InfraGroup } from "./relations";

export type AltTag = "same-problem" | "independent" | "same-family" | "thin";

export type CategorisedAlt = Alternative & {
  provider: Provider;
  headline: string;
  annotation?: string;
  tag?: AltTag;
};

const KIND_COPY: Record<string, { heading: string }> = {
  "closest-replacement": { heading: "Closest replacement" },
  "lower-risk-escape": { heading: "Lower-risk escape" },
  "diversify-rail": { heading: "Diversify instead of replace" },
  "independent-rail": { heading: "Diversify instead of replace" },
  "easier-onboarding": { heading: "Easier to get started" },
  "enterprise-step-up": { heading: "Enterprise step-up" },
  enterprise: { heading: "Enterprise step-up" },
  "merchant-of-record": { heading: "MoR option" },
  "backup-not-replacement": { heading: "Good backup. Not a replacement." },
  "lower-lockout": { heading: "Lower-risk escape" },
};

export function canonicalKind(k: AltKind | string): AltKind {
  if (k === "lower-lockout") return "lower-risk-escape";
  if (k === "independent-rail") return "diversify-rail";
  if (k === "enterprise") return "enterprise-step-up";
  return k as AltKind;
}

export function altHeading(k: AltKind | string): string {
  return KIND_COPY[canonicalKind(k)]?.heading ?? KIND_COPY[k]?.heading ?? "Also worth a look";
}

function architectureScore(a: Provider, b: Provider): number {
  const typeHit = a.types.filter((t) => b.types.includes(t)).length;
  const typeScore = typeHit / Math.max(1, Math.max(a.types.length, b.types.length));
  const agg = a.isAggregator === b.isAggregator ? 0.2 : 0;
  const mor = a.isMoR === b.isMoR ? 0.15 : 0;
  const direct = a.hasDirectMerchantAccount === b.hasDirectMerchantAccount ? 0.15 : 0;
  return Math.min(1, typeScore * 0.5 + agg + mor + direct);
}

function overlapCountries(a: Provider, b: Provider): number {
  if (!a.merchantCountries.length || !b.merchantCountries.length) return 0.35;
  const set = new Set(a.merchantCountries);
  const hit = b.merchantCountries.filter((c) => set.has(c)).length;
  if (hit > 0) return Math.min(1, hit / Math.max(1, Math.min(a.merchantCountries.length, 4)));
  const regionHit = a.regions.some((r) => b.regions.includes(r));
  return regionHit ? 0.4 : 0.12;
}

function featureSimilarity(a: Provider, b: Provider): number {
  const keys = ["digitalProducts", "saas", "ecommerce", "marketplace", "subscriptions", "highTicket", "physicalRetail"] as const;
  let same = 0;
  for (const k of keys) {
    const av = a.supports[k];
    const bv = b.supports[k];
    if (av === bv) same += 1;
    else if (av !== "no" && bv !== "no") same += 0.5;
  }
  return same / keys.length;
}

export type ScoredCandidate = {
  provider: Provider;
  total: number;
  architecture: number;
  country: number;
  model: number;
  feature: number;
  risk: number;
  confidence: number;
  why: string;
};

function pub(p: Provider): number {
  return p.publishedOverall ?? p.scores.overall;
}

function raw(p: Provider): number {
  return p.scores.overallRaw;
}

/** True only when the candidate is actually less lockout-exposed. */
export function strictlySafer(from: Provider, to: Provider): boolean {
  const d = pub(from) - pub(to);
  if (d > 0) return true;
  if (d < 0) return false;
  return raw(from) > raw(to);
}

function structuralEscape(from: Provider, to: Provider): boolean {
  return (
    (from.isAggregator && !to.isAggregator) ||
    (from.isMoR && !to.isMoR) ||
    (from.hasDirectMerchantAccount !== true && to.hasDirectMerchantAccount === true) ||
    to.types.includes("direct-acquirer")
  );
}

function isIndependentRail(from: Provider, to: Provider, related: InfraGroup[]): boolean {
  if (related.length) return false;
  const fromCard = from.types.some((t) => t === "psp" || t === "payment-aggregator" || t === "direct-acquirer" || t === "merchant-account-provider");
  const toBank = to.types.includes("pay-by-bank") || to.types.includes("alternative-payment-method");
  const toWallet = to.types.includes("wallet") && !from.types.includes("wallet");
  const toDirect = from.isAggregator && to.hasDirectMerchantAccount === true && !to.isAggregator;
  return Boolean((fromCard && toBank) || toWallet || toDirect);
}

function reciprocalEscape(from: Provider, to: Provider): boolean {
  return to.alternatives.some((a) => a.providerId === from.id && canonicalKind(a.kind) === "lower-risk-escape");
}

export function humanWhy(kind: AltKind, from: Provider, to: Provider, related: InfraGroup[]): string {
  const delta = Math.round(pub(from) - pub(to));
  const independent = isIndependentRail(from, to, related);
  if (kind === "closest-replacement") {
    if (related.length) return "Similar setup. Not much of a risk escape.";
    if (Math.abs(delta) < 8) return "Similar setup. Not much of a risk escape.";
    return "Closest operational replacement among names we actually researched.";
  }
  if (kind === "lower-risk-escape") {
    if (independent) return "Different rail entirely. That's real diversification.";
    if (delta >= 8) return "Actually reduces your platform dependency.";
    if (structuralEscape(from, to)) return "More traditional acquiring relationship.";
    return "Good backup. Not a full replacement.";
  }
  if (kind === "diversify-rail") return "Different rail entirely. That's real diversification.";
  if (kind === "easier-onboarding") return "Easier onboarding, but the dependency problem remains.";
  if (kind === "enterprise-step-up") return "Enterprise option. Probably overkill unless you're moving serious volume.";
  if (kind === "merchant-of-record") return "They handle the tax paperwork. You handle a fatter dependency.";
  if (kind === "backup-not-replacement") return "Good backup. Bad escape plan.";
  if (independent) return "Different rail entirely. That's real diversification.";
  return "Worth a look. Confirm it actually diversifies risk.";
}

function tagFor(kind: AltKind, from: Provider, to: Provider, related: InfraGroup[]): AltTag | undefined {
  if (to.researchStatus === "in-research" || to.researchStatus === "pending") return "thin";
  if (related.length) return "same-family";
  if (isIndependentRail(from, to, related)) return "independent";
  if (kind === "closest-replacement" && Math.abs(pub(from) - pub(to)) < 8) return "same-problem";
  if (kind === "lower-risk-escape" && pub(from) - pub(to) < 8 && !structuralEscape(from, to)) return "same-problem";
  return undefined;
}

function annotationFor(tag: AltTag | undefined): string | undefined {
  if (tag === "thin") return "Possible alternative — evidence confidence is still low";
  if (tag === "same-family") return "These aren't as independent as they look.";
  if (tag === "same-problem") return "SAME PROBLEM, DIFFERENT LOGO";
  if (tag === "independent") return "ACTUALLY INDEPENDENT";
  return undefined;
}

function scoreCandidate(p: Provider, cand: Provider, countryIso?: string): ScoredCandidate {
  const architecture = architectureScore(p, cand);
  let country = overlapCountries(p, cand);
  if (countryIso) {
    country = cand.merchantCountries.includes(countryIso) ? 1 : cand.merchantCountries.length ? 0.15 : 0.35;
  }
  const model = featureSimilarity(p, cand);
  const feature = model;
  const pScore = pub(p);
  const cScore = pub(cand);
  const risk = Math.max(0, Math.min(1, (pScore - cScore + 20) / 40));
  const confidence = cand.confidence / 100;
  const total =
    architecture * 0.25 + country * 0.25 + model * 0.2 + feature * 0.1 + risk * 0.1 + confidence * 0.1;
  let why = "Worth a look. Confirm it actually diversifies risk.";
  if (architecture >= 0.7 && country >= 0.5) why = "Closest operational replacement among names we actually researched.";
  else if (cScore <= pScore - 8) why = "Actually reduces your platform dependency.";
  else if (cand.types.includes("pay-by-bank") || cand.types.includes("wallet")) why = "Different rail entirely. That's real diversification.";
  else if (cand.focus === "sme" && p.focus !== "sme") why = "Easier onboarding, but the dependency problem remains.";
  else if (country < 0.3) why = "Not available where you live. Rude.";
  return { provider: cand, total, architecture, country, model, feature, risk, confidence, why };
}

const MIN_ESCAPE_POINTS = 8;

export function buildAltCategories(
  p: Provider,
  all: Provider[],
  infra: InfraGroup[],
  countryIso?: string,
): { kind: AltKind; heading: string; items: CategorisedAlt[] }[] {
  const pool = all.filter((x) => x.id !== p.id);
  const scored = pool.map((c) => scoreCandidate(p, c, countryIso)).sort((a, b) => b.total - a.total);

  const related = (id: string) => infra.filter((g) => g.members.includes(p.id) && g.members.includes(id));

  const curated = p.alternatives
    .map((a) => {
      const provider = all.find((x) => x.id === a.providerId);
      if (!provider) return null;
      return { ...a, kind: canonicalKind(a.kind), provider };
    })
    .filter((x): x is Alternative & { provider: Provider; kind: AltKind } => Boolean(x));

  const claimed = new Set<string>();

  function take(
    kind: AltKind,
    pred: (c: ScoredCandidate) => boolean,
    limit = 2,
  ): CategorisedAlt[] {
    const fromCurated = curated
      .filter((c) => canonicalKind(c.kind) === kind)
      .filter((c) => !claimed.has(c.providerId))
      .filter((c) => {
        if (kind === "lower-risk-escape") {
          if (reciprocalEscape(p, c.provider) && !strictlySafer(p, c.provider)) return false;
          const delta = pub(p) - pub(c.provider);
          return delta >= MIN_ESCAPE_POINTS || (structuralEscape(p, c.provider) && strictlySafer(p, c.provider));
        }
        return true;
      })
      .map((c) => {
        const rel = related(c.provider.id);
        const tag = tagFor(kind, p, c.provider, rel);
        const delta = pub(c.provider) - pub(p);
        return {
          ...c,
          why: humanWhy(kind, p, c.provider, rel),
          headline: humanWhy(kind, p, c.provider, rel),
          annotation: annotationFor(tag),
          tag,
          directional: kind === "lower-risk-escape",
          riskDelta: delta,
        };
      });

    const used = new Set(fromCurated.map((x) => x.providerId));
    const extras = scored
      .filter((c) => !used.has(c.provider.id) && !claimed.has(c.provider.id) && pred(c))
      .slice(0, Math.max(0, limit - fromCurated.length))
      .map((c) => {
        const rel = related(c.provider.id);
        const tag = tagFor(kind, p, c.provider, rel);
        const delta = pub(c.provider) - pub(p);
        return {
          providerId: c.provider.id,
          kind,
          why: humanWhy(kind, p, c.provider, rel),
          provider: c.provider,
          headline: humanWhy(kind, p, c.provider, rel),
          annotation: annotationFor(tag),
          tag,
          directional: kind === "lower-risk-escape",
          riskDelta: delta,
        };
      });

    const items = [...fromCurated, ...extras].slice(0, limit);
    for (const item of items) claimed.add(item.providerId);
    return items;
  }

  const pScore = pub(p);

  const groups: { kind: AltKind; heading: string; items: CategorisedAlt[] }[] = [
    {
      kind: "closest-replacement",
      heading: altHeading("closest-replacement"),
      items: take("closest-replacement", (c) => c.architecture >= 0.45 && related(c.provider.id).length === 0),
    },
    {
      kind: "lower-risk-escape",
      heading: altHeading("lower-risk-escape"),
      items: take("lower-risk-escape", (c) => {
        if (reciprocalEscape(p, c.provider) && !strictlySafer(p, c.provider)) return false;
        const delta = pScore - pub(c.provider);
        const structural = structuralEscape(p, c.provider);
        return (delta >= MIN_ESCAPE_POINTS || (structural && strictlySafer(p, c.provider))) && related(c.provider.id).length === 0;
      }),
    },
    {
      kind: "diversify-rail",
      heading: altHeading("diversify-rail"),
      items: take(
        "diversify-rail",
        (c) =>
          c.provider.types.includes("pay-by-bank") ||
          c.provider.types.includes("alternative-payment-method") ||
          (c.provider.types.includes("wallet") && !p.types.includes("wallet")),
        2,
      ),
    },
    {
      kind: "easier-onboarding",
      heading: altHeading("easier-onboarding"),
      items: take("easier-onboarding", (c) => c.provider.focus !== "enterprise" && c.provider.isAggregator, 1),
    },
    {
      kind: "enterprise-step-up",
      heading: altHeading("enterprise-step-up"),
      items:
        p.focus === "enterprise" && pScore < 50
          ? []
          : take(
              "enterprise-step-up",
              (c) => c.provider.focus !== "sme" && (c.provider.types.includes("direct-acquirer") || c.provider.types.includes("psp")),
              1,
            ),
    },
    {
      kind: "merchant-of-record",
      heading: altHeading("merchant-of-record"),
      items: p.isMoR ? [] : take("merchant-of-record", (c) => c.provider.isMoR, 1),
    },
  ];

  return groups.filter((g) => g.items.length > 0);
}

export function rankSimilar(p: Provider, all: Provider[], countryIso?: string): ScoredCandidate[] {
  return all
    .filter((x) => x.id !== p.id)
    .map((c) => scoreCandidate(p, c, countryIso))
    .sort((a, b) => b.total - a.total);
}

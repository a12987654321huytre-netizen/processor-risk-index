import type { AltKind, Alternative, Provider } from "./types";
import type { InfraGroup } from "./relations";

export type CategorisedAlt = Alternative & {
  provider: Provider;
  headline: string;
  annotation?: string;
};

const KIND_COPY: Record<string, { heading: string; hideIfEmpty?: boolean }> = {
  "closest-replacement": { heading: "Closest replacement" },
  "lower-risk-escape": { heading: "Lower-risk escape route" },
  "diversify-rail": { heading: "Diversify instead of replace" },
  "independent-rail": { heading: "Diversify instead of replace" },
  "easier-onboarding": { heading: "Easier to get started" },
  "enterprise-step-up": { heading: "If you’ve outgrown this" },
  enterprise: { heading: "If you’ve outgrown this" },
  "merchant-of-record": { heading: "Want someone else to deal with the tax headache?" },
  "backup-not-replacement": { heading: "Good backup. Not a replacement." },
  "lower-lockout": { heading: "Lower-risk escape route" },
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

function scoreCandidate(p: Provider, cand: Provider, countryIso?: string): ScoredCandidate {
  const architecture = architectureScore(p, cand);
  let country = overlapCountries(p, cand);
  if (countryIso) {
    country = cand.merchantCountries.includes(countryIso) ? 1 : cand.merchantCountries.length ? 0.15 : 0.35;
  }
  const model = featureSimilarity(p, cand);
  const feature = model;
  const pScore = p.publishedOverall ?? p.scores.overall;
  const cScore = cand.publishedOverall ?? cand.scores.overall;
  const risk = Math.max(0, Math.min(1, (pScore - cScore + 20) / 40));
  const confidence = cand.confidence / 100;
  const total =
    architecture * 0.25 + country * 0.25 + model * 0.2 + feature * 0.1 + risk * 0.1 + confidence * 0.1;
  let why = "Similar job, different logo — confirm it actually diversifies risk.";
  if (architecture >= 0.7 && country >= 0.5) why = "Closest architectural substitute among the names we have actually researched.";
  else if (cScore <= pScore - 8) why = "Actually reduces your dependency instead of just moving it around.";
  else if (cand.types.includes("pay-by-bank") || cand.types.includes("wallet")) why = "Another card processor is useful. Another payment rail is better.";
  else if (cand.focus === "sme" && p.focus !== "sme") why = "Easy to join. Slightly harder to sleep at night.";
  else if (country < 0.3) why = "Looks great. Unfortunately they may not want merchants from your country.";
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

  const related = (id: string) =>
    infra.filter((g) => g.members.includes(p.id) && g.members.includes(id));

  const curated = p.alternatives
    .map((a) => {
      const provider = all.find((x) => x.id === a.providerId);
      if (!provider) return null;
      return { ...a, kind: canonicalKind(a.kind), provider };
    })
    .filter((x): x is Alternative & { provider: Provider; kind: AltKind } => Boolean(x));

  function take(kind: AltKind, pred: (c: ScoredCandidate) => boolean, fallbackWhy: (c: ScoredCandidate) => string, limit = 2): CategorisedAlt[] {
    const fromCurated = curated
      .filter((c) => canonicalKind(c.kind) === kind)
      .filter((c) => {
        if (kind === "lower-risk-escape") {
          const delta = (p.publishedOverall ?? p.scores.overall) - (c.provider.publishedOverall ?? c.provider.scores.overall);
          const structural =
            (p.isAggregator && !c.provider.isAggregator) ||
            (p.isMoR && !c.provider.isMoR) ||
            (p.hasDirectMerchantAccount !== true && c.provider.hasDirectMerchantAccount === true);
          return delta >= MIN_ESCAPE_POINTS || structural;
        }
        return true;
      })
      .map((c) => {
        const delta =
          (c.provider.publishedOverall ?? c.provider.scores.overall) - (p.publishedOverall ?? p.scores.overall);
        const sameFamily = related(c.provider.id);
        const incomplete = c.provider.researchStatus === "in-research" || c.provider.researchStatus === "pending";
        return {
          ...c,
          headline: c.why,
          annotation: incomplete
            ? "Possible alternative — evidence confidence is still low"
            : sameFamily.length
              ? "These aren’t as independent as they look."
              : kind === "lower-risk-escape" && delta > -MIN_ESCAPE_POINTS && !(p.isAggregator && !c.provider.isAggregator)
                ? "Same problem, different logo"
                : undefined,
          directional: kind === "lower-risk-escape",
          riskDelta: delta,
        };
      });

    const used = new Set(fromCurated.map((x) => x.providerId));
    const extras = scored
      .filter((c) => !used.has(c.provider.id) && pred(c))
      .slice(0, Math.max(0, limit - fromCurated.length))
      .map((c) => {
        const sameFamily = related(c.provider.id);
        const delta = (c.provider.publishedOverall ?? c.provider.scores.overall) - (p.publishedOverall ?? p.scores.overall);
        const incomplete = c.provider.researchStatus === "in-research" || c.provider.researchStatus === "pending";
        return {
          providerId: c.provider.id,
          kind,
          why: fallbackWhy(c),
          provider: c.provider,
          headline: fallbackWhy(c),
          annotation: incomplete
            ? "Possible alternative — evidence confidence is still low"
            : sameFamily.length
              ? "These aren’t as independent as they look."
              : undefined,
          directional: kind === "lower-risk-escape",
          riskDelta: delta,
        };
      });

    return [...fromCurated, ...extras].slice(0, limit);
  }

  const pScore = p.publishedOverall ?? p.scores.overall;

  const groups: { kind: AltKind; heading: string; items: CategorisedAlt[] }[] = [
    {
      kind: "closest-replacement",
      heading: altHeading("closest-replacement"),
      items: take(
        "closest-replacement",
        (c) => c.architecture >= 0.45 && related(c.provider.id).length === 0,
        (c) => c.why,
      ),
    },
    {
      kind: "lower-risk-escape",
      heading: altHeading("lower-risk-escape"),
      items: take(
        "lower-risk-escape",
        (c) => {
          const delta = pScore - (c.provider.publishedOverall ?? c.provider.scores.overall);
          const structural =
            (p.isAggregator && !c.provider.isAggregator) ||
            (p.isMoR && !c.provider.isMoR) ||
            c.provider.types.includes("direct-acquirer");
          return (delta >= MIN_ESCAPE_POINTS || structural) && related(c.provider.id).length === 0;
        },
        (c) => {
          const delta = Math.round(pScore - (c.provider.publishedOverall ?? c.provider.scores.overall));
          if (delta >= MIN_ESCAPE_POINTS) return `↓ ${delta} risk points. Your emergency exit — not a clone.`;
          return "Actually reduces your dependency instead of just moving it around.";
        },
      ),
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
        () => "This is diversification. Another card processor is useful; another rail is better.",
        2,
      ),
    },
    {
      kind: "easier-onboarding",
      heading: altHeading("easier-onboarding"),
      items: take(
        "easier-onboarding",
        (c) => c.provider.focus !== "enterprise" && c.provider.isAggregator,
        () => "Easy to join. Slightly harder to sleep at night. Not a lower-risk claim.",
        1,
      ),
    },
    {
      kind: "enterprise-step-up",
      heading: altHeading("enterprise-step-up"),
      items: p.focus === "enterprise" && pScore < 50
        ? []
        : take(
            "enterprise-step-up",
            (c) => c.provider.focus !== "sme" && (c.provider.types.includes("direct-acquirer") || c.provider.types.includes("psp")),
            () => "Probably overkill unless you’re moving serious volume.",
            1,
          ),
    },
    {
      kind: "merchant-of-record",
      heading: altHeading("merchant-of-record"),
      items: p.isMoR
        ? []
        : take(
            "merchant-of-record",
            (c) => c.provider.isMoR,
            () => "They handle the tax paperwork. You handle a fatter dependency.",
            1,
          ),
    },
    {
      kind: "backup-not-replacement",
      heading: altHeading("backup-not-replacement"),
      items: take(
        "backup-not-replacement",
        (c) => c.provider.types.includes("wallet") || c.provider.types.includes("pay-by-bank"),
        () => "Good backup. Bad escape plan.",
        1,
      ),
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

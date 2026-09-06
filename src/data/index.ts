import type {
  Alternative,
  BusinessModel,
  Provider,
  ProviderType,
  Region,
  Source,
} from "./types";
import { rankProviders, safestFirst, bandFor, confidenceLabel } from "./scoring";
import { TOP10 } from "./providers/top10";
import { TOP10B } from "./providers/top10b";
import { CORE_REST } from "./providers/core-rest";
import { BATCH_B } from "./providers/batch-b";
import { BATCH_C } from "./providers/batch-c";
import { BATCH_D } from "./providers/batch-d";
import { BATCH_E } from "./providers/batch-e";
import { SOURCES } from "./sources";
import { MORE_SOURCES } from "./sources-more";
import { BATCH_D_SOURCES } from "./sources-batch-d";
import { COUNTRIES } from "./countries";

export const PROVIDERS: Provider[] = [
  ...TOP10,
  ...TOP10B,
  ...CORE_REST,
  ...BATCH_B,
  ...BATCH_C,
  ...BATCH_D,
  ...BATCH_E,
];

export const SOURCES_ALL: Source[] = [...SOURCES, ...MORE_SOURCES, ...BATCH_D_SOURCES];

const providerById = new Map(PROVIDERS.map((p) => [p.id, p]));
const providerBySlug = new Map(PROVIDERS.map((p) => [p.slug, p]));
const sourcesById = new Map(SOURCES_ALL.map((s) => [s.id, s]));

export function getProvider(idOrSlug: string): Provider | undefined {
  return providerById.get(idOrSlug) || providerBySlug.get(idOrSlug);
}

export function getSource(id: string): Source | undefined {
  return sourcesById.get(id);
}

export function sourcesFor(provider: Provider): Source[] {
  return provider.sourceIds.map((id) => sourcesById.get(id)).filter((s): s is Source => Boolean(s));
}

export function allAliases(p: Provider): string[] {
  return [p.name, p.id, p.slug, ...p.aliases].map((s) => s.toLowerCase());
}

export function searchProviders(q: string): Provider[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return rankProviders(PROVIDERS);
  return PROVIDERS.filter((p) => {
    if (allAliases(p).some((a) => a.includes(needle))) return true;
    if (p.legalName.toLowerCase().includes(needle)) return true;
    if (p.types.some((t) => t.includes(needle))) return true;
    return p.verdict.short.toLowerCase().includes(needle);
  });
}

export type RankFilters = {
  region?: Region | "all";
  type?: ProviderType | "all";
  model?: BusinessModel | "all";
  risk?: "all" | "low" | "guarded" | "moderate" | "high" | "very-high" | "extreme";
  confidence?: "all" | "high" | "medium" | "low";
  q?: string;
  sort?: "risk-desc" | "risk-asc" | "name" | "confidence";
};

export function supportsModel(p: Provider, model: BusinessModel): boolean {
  switch (model) {
    case "ecommerce":
      return p.supports.ecommerce !== "no";
    case "digital-downloads":
      return p.supports.digitalProducts !== "no";
    case "saas":
      return p.supports.saas !== "no";
    case "subscriptions":
      return p.supports.subscriptions !== "no";
    case "services":
      return p.supports.saas !== "no" || p.supports.ecommerce !== "no";
    case "marketplaces":
      return p.supports.marketplace !== "no";
    case "high-ticket":
      return p.supports.highTicket !== "no";
    case "physical-retail":
      return p.supports.physicalRetail !== "no";
    case "freelancers":
      return p.typicalMerchantSize.some((s) => /freelance|smb|micro|sole/i.test(s)) || p.focus === "sme";
    default:
      return true;
  }
}

export function filterProviders(f: RankFilters): Provider[] {
  let list = f.q ? searchProviders(f.q) : [...PROVIDERS];
  if (f.region && f.region !== "all") {
    list = list.filter((p) => p.regions.includes(f.region as Region) || p.merchantCountries.length === 0);
  }
  if (f.type && f.type !== "all") list = list.filter((p) => p.types.includes(f.type as ProviderType));
  if (f.model && f.model !== "all") list = list.filter((p) => supportsModel(p, f.model as BusinessModel));
  if (f.risk && f.risk !== "all") {
    list = list.filter((p) => bandFor(p.scores.overall)?.id === f.risk);
  }
  if (f.confidence && f.confidence !== "all") {
    list = list.filter((p) => confidenceLabel(p.confidence).tone === f.confidence);
  }
  const sort = f.sort ?? "risk-desc";
  if (sort === "risk-asc") return safestFirst(list);
  if (sort === "name") return [...list].sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "confidence") return [...list].sort((a, b) => b.confidence - a.confidence || b.scores.overall - a.scores.overall);
  return rankProviders(list);
}

export function resolveAlternatives(
  p: Provider,
): Array<Alternative & { provider: Provider }> {
  return p.alternatives
    .map((a) => {
      const provider = getProvider(a.providerId);
      if (!provider) return null;
      return { ...a, provider };
    })
    .filter((x): x is Alternative & { provider: Provider } => Boolean(x));
}

export type AltScore = {
  provider: Provider;
  total: number;
  why: string[];
  breakdown: { label: string; pct: number; score: number }[];
};

function overlapCountries(a: Provider, b: Provider): number {
  if (!a.merchantCountries.length || !b.merchantCountries.length) return 0.4;
  const set = new Set(a.merchantCountries);
  const hit = b.merchantCountries.filter((c) => set.has(c)).length;
  if (hit > 0) return Math.min(1, hit / Math.max(1, Math.min(a.merchantCountries.length, 3)));
  const regionHit = a.regions.some((r) => b.regions.includes(r));
  return regionHit ? 0.45 : 0.15;
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
  const typeHit = a.types.some((t) => b.types.includes(t)) ? 0.2 : 0;
  return Math.min(1, same / keys.length + typeHit);
}

export function matchAlternatives(p: Provider, countryIso?: string): AltScore[] {
  const others = PROVIDERS.filter((x) => x.id !== p.id && x.researchStatus !== "pending");
  const scored: AltScore[] = others.map((cand) => {
    let country = overlapCountries(p, cand);
    if (countryIso) {
      country = cand.merchantCountries.includes(countryIso) ? 1 : cand.regions.length ? 0.2 : 0;
    }
    const model = featureSimilarity(p, cand);
    const feature = featureSimilarity(p, cand);
    const lowerDep = Math.max(0, Math.min(1, (p.dimensions.dependency - cand.dimensions.dependency + 5) / 10));
    const riskImprove = Math.max(0, Math.min(1, (p.scores.overall - cand.scores.overall + 20) / 40));
    const conf = cand.confidence / 100;
    const parts = [
      { label: "Country eligibility", pct: 25, score: country },
      { label: "Business-model fit", pct: 20, score: model },
      { label: "Feature similarity", pct: 15, score: feature },
      { label: "Lower platform dependency", pct: 15, score: lowerDep },
      { label: "Risk-score improvement", pct: 15, score: riskImprove },
      { label: "Evidence confidence", pct: 10, score: conf },
    ];
    const total = parts.reduce((s, x) => s + x.score * (x.pct / 100), 0);
    const why: string[] = [];
    if (countryIso && cand.merchantCountries.includes(countryIso)) why.push(`Sourced merchant onboarding in ${countryIso}.`);
    else if (country >= 0.5) why.push("Overlapping merchant-country coverage.");
    else why.push("Country overlap is weak — confirm eligibility before migrating.");
    if (cand.scores.overall < p.scores.overall) why.push(`Lower lockout index (${cand.scores.overall} vs ${p.scores.overall}).`);
    if (cand.dimensions.dependency < p.dimensions.dependency) why.push("Less platform coupling on the scoring model.");
    if (cand.isMoR && p.isMoR) why.push("Also a Merchant of Record — similar blast radius, different entity.");
    if (!cand.isMoR && p.isMoR) why.push("You would remain the merchant of record.");
    const overlap = INFRASTRUCTURE.find((g) => g.members.includes(p.id) && g.members.includes(cand.id));
    if (overlap) why.push(`Infrastructure warning: ${overlap.warning}`);
    return { provider: cand, total, why, breakdown: parts };
  });
  scored.sort((a, b) => b.total - a.total);
  return scored.slice(0, 8);
}

export type InfraGroup = {
  id: string;
  label: string;
  members: string[];
  warning: string;
};

export const INFRASTRUCTURE: InfraGroup[] = [
  {
    id: "stripe-family",
    label: "Stripe family",
    members: ["stripe", "shopify-payments", "lemon-squeezy"],
    warning:
      "Shopify Payments is often Stripe underneath. Lemon Squeezy LLC provides Stripe Managed Payments. Two logos, one family tree.",
  },
  {
    id: "paypal-family",
    label: "PayPal family",
    members: ["paypal", "braintree"],
    warning: "Braintree is a PayPal service. A Braintree ‘backup’ next to PayPal is not two processors.",
  },
  {
    id: "elavon-family",
    label: "Elavon family",
    members: ["elavon", "helcim"],
    warning: "Helcim is a PayFac sponsored by Elavon. Elavon is the acquirer of record.",
  },
  {
    id: "mollie-gc",
    label: "Mollie / GoCardless",
    members: ["mollie", "gocardless"],
    warning: "Mollie acquired GoCardless. Bank-debit next to Mollie cards may still sit in one group.",
  },
];

export function infraWarnings(ids: string[]): InfraGroup[] {
  return INFRASTRUCTURE.filter((g) => {
    const hit = g.members.filter((m) => ids.includes(m));
    return hit.length >= 2;
  });
}

export { COUNTRIES };
export { rankProviders, safestFirst, bandFor, confidenceLabel };

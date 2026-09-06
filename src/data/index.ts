import type { Alternative, BusinessModel, Provider, ProviderType, Region, Source } from "./types";
import { rankProviders, safestFirst, riskiestFirst, bandFor, confidenceLabel } from "./scoring";
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
import { COMMUNITY_SOURCES } from "./sources-community";
import { TOP50_SOURCES } from "./sources-top50";
import { REGIONAL_SOURCES } from "./sources-regional";
import { COUNTRIES } from "./countries";
import { enrichAll, researchStats } from "./enrich";
import { INFRASTRUCTURE, infraWarnings, infraFor } from "./relations";
import { buildAltCategories, rankSimilar, type CategorisedAlt, type ScoredCandidate } from "./alternatives";

const RAW: Provider[] = [...TOP10, ...TOP10B, ...CORE_REST, ...BATCH_B, ...BATCH_C, ...BATCH_D, ...BATCH_E];

function dedupeSources(list: Source[]): Source[] {
  const seen = new Set<string>();
  const out: Source[] = [];
  for (const s of list) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    out.push(s);
  }
  return out;
}

export const SOURCES_ALL: Source[] = dedupeSources([
  ...SOURCES,
  ...MORE_SOURCES,
  ...BATCH_D_SOURCES,
  ...COMMUNITY_SOURCES,
  ...TOP50_SOURCES,
  ...REGIONAL_SOURCES,
]);

export const PROVIDERS: Provider[] = enrichAll(RAW, SOURCES_ALL);
export const RESEARCH_STATS = researchStats(PROVIDERS);

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
  risk?: "all" | "low" | "guarded" | "moderate" | "elevated" | "high" | "severe" | "very-high" | "extreme";
  confidence?: "all" | "high" | "medium" | "low";
  status?: "all" | "verified" | "provisional" | "in-research" | "pending";
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
  if (f.status && f.status !== "all") list = list.filter((p) => p.researchStatus === f.status);
  if (f.model && f.model !== "all") list = list.filter((p) => supportsModel(p, f.model as BusinessModel));
  if (f.risk && f.risk !== "all") {
    const want = f.risk === "very-high" ? "high" : f.risk === "extreme" ? "severe" : f.risk;
    list = list.filter((p) => bandFor(p.publishedOverall)?.id === want);
  }
  if (f.confidence && f.confidence !== "all") {
    list = list.filter((p) => confidenceLabel(p.confidence).tone === f.confidence);
  }
  const sort = f.sort ?? "risk-desc";
  if (sort === "risk-asc") return safestFirst(list);
  if (sort === "name") return [...list].sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "confidence") return [...list].sort((a, b) => b.confidence - a.confidence || b.publishedOverall - a.publishedOverall);
  return rankProviders(list);
}

export function resolveAlternatives(p: Provider): Array<Alternative & { provider: Provider }> {
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

export function matchAlternatives(p: Provider, countryIso?: string): AltScore[] {
  return rankSimilar(p, PROVIDERS, countryIso)
    .slice(0, 8)
    .map((c: ScoredCandidate) => ({
      provider: c.provider,
      total: c.total,
      why: [c.why],
      breakdown: [
        { label: "Architecture", pct: 25, score: c.architecture },
        { label: "Country eligibility", pct: 25, score: c.country },
        { label: "Business-model fit", pct: 20, score: c.model },
        { label: "Feature similarity", pct: 10, score: c.feature },
        { label: "Risk-score improvement", pct: 10, score: c.risk },
        { label: "Evidence confidence", pct: 10, score: c.confidence },
      ],
    }));
}

export function alternativeGroups(p: Provider, countryIso?: string) {
  return buildAltCategories(p, PROVIDERS, INFRASTRUCTURE, countryIso);
}

export type { CategorisedAlt } from "./alternatives";
export type { InfraGroup } from "./relations";

export { COUNTRIES, INFRASTRUCTURE, infraWarnings, infraFor };
export { rankProviders, safestFirst, riskiestFirst, bandFor, confidenceLabel };
export { RESEARCH_STATS as stats };

import type {
  ConfidenceBand,
  ConfidenceBreakdown,
  Incident,
  OfficialCoverage,
  OfficialFinding,
  Provider,
  ResearchDepth,
  ResearchDepthBand,
  Source,
} from "./types";

const OFFICIAL_TYPES = new Set(["official-agreement", "help-centre", "regulatory", "court", "filing"]);
const INDEPENDENT_TYPES = new Set(["reddit", "forum", "journalism", "review-platform", "public-social"]);

const AS_OF = new Date("2026-09-06");

function monthsAgo(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso.length === 7 ? `${iso}-01` : iso);
  if (Number.isNaN(d.getTime())) return null;
  return (AS_OF.getFullYear() - d.getFullYear()) * 12 + (AS_OF.getMonth() - d.getMonth());
}

export function isOfficialSource(s: Source): boolean {
  return OFFICIAL_TYPES.has(s.sourceType);
}

export function isIndependentSource(s: Source): boolean {
  return INDEPENDENT_TYPES.has(s.sourceType);
}

export function uniqueIncidents(incidents: Incident[]): Incident[] {
  const seen = new Set<string>();
  const out: Incident[] = [];
  for (const inc of incidents) {
    const key = inc.duplicateGroup || inc.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(inc);
  }
  return out;
}

export function officialCoverage(p: Provider, sources: Source[]): OfficialCoverage {
  const official = sources.filter(isOfficialSource);
  const topics = new Set<string>();
  for (const s of official) for (const t of s.topics) topics.add(t.toLowerCase());
  for (const f of p.contract) topics.add(f.topic);
  const has = (...keys: string[]) => keys.some((k) => [...topics].some((t) => t.includes(k)));
  const textHit = (re: RegExp) =>
    p.contract.some((f) => re.test(`${f.topic} ${f.title} ${f.paraphrase}`)) ||
    official.some((s) => re.test(`${s.topics.join(" ")} ${s.title} ${s.notes}`));

  const termination =
    has("termination", "suspension") ||
    p.contract.some((f) => f.topic === "termination" || f.topic === "suspension") ||
    textHit(/terminat|suspend/);
  const holdsReserves =
    has("reserve", "hold", "payout") ||
    p.contract.some((f) => f.topic === "reserves" || f.topic === "funds-holds" || f.topic === "payouts");
  const restricted =
    has("restricted", "prohibited", "acceptable", "banned") ||
    p.contract.some((f) => f.topic === "restricted-businesses") ||
    textHit(/prohibit|restricted business|acceptable use|illegal product|banned categor/);
  const payouts = has("payout", "settlement", "reserve", "hold") || holdsReserves;
  const geography = p.merchantCountriesSourced && (p.merchantCountries.length > 0 || has("countr"));
  const appealSupport =
    has("support", "appeal") ||
    p.snapshot.appealAvailable === true ||
    p.snapshot.supportAccess === "24-7-phone-chat-email" ||
    p.snapshot.supportAccess === "phone-available" ||
    p.contract.some((f) => f.topic === "support" || f.topic === "appeal");

  let points = 0;
  if (termination) points += 7;
  if (holdsReserves) points += 7;
  if (restricted) points += 6;
  if (payouts) points += 5;
  if (geography) points += 5;
  if (appealSupport) points += 5;

  const agreements = official.filter((s) => s.sourceType === "official-agreement");
  const comprehensiveAgreement = agreements.some((s) => {
    const t = s.topics.map((x) => x.toLowerCase());
    const cover =
      t.some((x) => /terminat|suspen/.test(x)) &&
      t.some((x) => /hold|reserve|payout/.test(x));
    return cover || t.length >= 3;
  });

  const missing: string[] = [];
  if (!termination) missing.push("termination/suspension");
  if (!holdsReserves) missing.push("holds/reserves");
  if (!restricted) missing.push("restricted businesses");
  if (!payouts) missing.push("payout/settlement");
  if (!geography) missing.push("merchant geography");
  if (!appealSupport) missing.push("support/appeal");

  return {
    termination,
    holdsReserves,
    restricted,
    payouts,
    geography,
    appealSupport,
    officialSourceCount: official.length,
    comprehensiveAgreement,
    points,
    missing,
  };
}

function independentPoints(n: number): number {
  if (n <= 0) return 0;
  if (n === 1) return 5;
  if (n <= 3) return 10;
  if (n <= 6) return 17;
  if (n <= 10) return 22;
  return 25;
}

function recencyPoints(sources: Source[]): number {
  if (!sources.length) return 0;
  const ages = sources.map((s) => monthsAgo(s.publicationDate) ?? monthsAgo(s.accessedDate)).filter((n): n is number => n !== null);
  if (!ages.length) return 6;
  const freshOfficial = sources.filter(isOfficialSource).some((s) => {
    const a = monthsAgo(s.publicationDate) ?? monthsAgo(s.accessedDate);
    return a !== null && a <= 24;
  });
  const freshIndependent = sources.filter(isIndependentSource).some((s) => {
    const a = monthsAgo(s.publicationDate) ?? monthsAgo(s.accessedDate);
    return a !== null && a <= 24;
  });
  if (freshOfficial && (freshIndependent || sources.filter(isIndependentSource).length === 0)) return 15;
  if (freshOfficial) return 12;
  const any24 = ages.some((a) => a <= 24);
  if (any24) return 9;
  const any48 = ages.some((a) => a <= 48);
  if (any48) return 5;
  return 2;
}

function jurisdictionPoints(p: Provider, sources: Source[], findings: OfficialFinding[]): number {
  const juris = new Set<string>();
  for (const s of sources) {
    if (s.jurisdiction) {
      s.jurisdiction
        .split(/[,/]/)
        .map((x) => x.trim().toUpperCase())
        .filter((x) => x && x !== "UNKNOWN")
        .forEach((x) => {
          if (x === "GLOBAL" || x.startsWith("VARIES")) juris.add("GLOBAL");
          else juris.add(x);
        });
    }
  }
  for (const f of findings) {
    if (f.jurisdiction) juris.add(f.jurisdiction.toUpperCase());
  }
  const n = juris.size;
  const sourcedGeo = p.merchantCountriesSourced && p.merchantCountries.length >= 3;
  if (n >= 3 || (juris.has("GLOBAL") && n >= 2)) return 10;
  if (sourcedGeo && (juris.has("GLOBAL") || n >= 1)) return 8;
  if (n === 2) return 7;
  if (n === 1) return 6;
  if (sourcedGeo) return 5;
  return 2;
}

function diversityPoints(sources: Source[]): number {
  const types = new Set(sources.map((s) => s.sourceType));
  const n = types.size;
  if (n >= 5) return 10;
  if (n === 4) return 9;
  if (n === 3) return 7;
  if (n === 2) return 5;
  if (n === 1) return 2;
  return 0;
}

function contradictionPoints(p: Provider, incidents: Incident[]): number {
  const restored = incidents.some((i) =>
    /restored|funds-released|partially-restored|reserve-removed/.test(i.outcome),
  );
  const negative = incidents.some((i) =>
    /permanently-closed|funds-still-held|unresolved/.test(i.outcome),
  );
  if (restored && negative) return 5;
  if (p.positiveOutcomes.length && incidents.length) return 4;
  if (p.complaintVolumeNote && /not normalised|popularity/i.test(p.complaintVolumeNote)) return 3;
  if (incidents.length || p.contract.length) return 2;
  return 1;
}

export function confidenceBand(total: number): ConfidenceBand {
  if (total >= 85) return "high";
  if (total >= 70) return "good";
  if (total >= 50) return "medium";
  if (total >= 30) return "low";
  return "very-low";
}

export function computeConfidence(p: Provider, sources: Source[]): { breakdown: ConfidenceBreakdown; coverage: OfficialCoverage; incidents: Incident[] } {
  const coverage = officialCoverage(p, sources);
  const incidents = uniqueIncidents(p.incidents);
  const independentSources = sources.filter(isIndependentSource);
  // If we have independent sources but no structured incidents, count sources conservatively (cap 3).
  const independentCount = incidents.length > 0 ? incidents.length : Math.min(independentSources.length, 3);

  const official = coverage.points;
  const independent = independentPoints(incidents.length > 0 ? incidents.length : independentCount);
  const recency = recencyPoints(sources);
  const jurisdiction = jurisdictionPoints(p, sources, p.contract);
  const diversity = diversityPoints(sources);
  const contradiction = contradictionPoints(p, incidents);
  const total = Math.max(0, Math.min(100, official + independent + recency + jurisdiction + diversity + contradiction));

  return {
    coverage,
    incidents,
    breakdown: {
      official,
      independent,
      recency,
      jurisdiction,
      diversity,
      contradiction,
      total,
      band: confidenceBand(total),
    },
  };
}

export function researchDepth(p: Provider, sources: Source[], incidents: Incident[], coverage: OfficialCoverage): ResearchDepth {
  const officialSources = sources.filter(isOfficialSource).length;
  const independentReports = sources.filter(isIndependentSource).length;
  const juris = new Set<string>();
  for (const s of sources) if (s.jurisdiction) juris.add(s.jurisdiction);
  const successful = incidents.filter((i) =>
    /restored|funds-released|partially-restored|reserve-removed/.test(i.outcome),
  ).length;

  let band: ResearchDepthBand = "low";
  if (coverage.points >= 28 && officialSources >= 3 && incidents.length >= 5) band = "high";
  else if (coverage.points >= 20 && officialSources >= 2) band = "medium";

  return {
    officialSources,
    independentReports,
    jurisdictions: juris.size,
    incidents: incidents.length,
    successfulResolutions: successful + p.positiveOutcomes.length,
    lastVerified: p.lastVerified,
    band,
  };
}

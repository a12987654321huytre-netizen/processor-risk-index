import type { EvidenceLabel, OfficialFinding, Source } from "@/data/types";
import { getSource } from "@/data";
import { cn } from "@/lib/utils";

const LABEL: Record<EvidenceLabel, { text: string; className: string }> = {
  "official-policy": { text: "Official policy", className: "text-official border-official/30 bg-accent-soft" },
  "merchant-report": { text: "Merchant report", className: "text-merchant border-border bg-surface" },
  "independent-reporting": { text: "Independent reporting", className: "text-journalism border-border bg-surface" },
  "provider-statement": { text: "Provider statement", className: "text-provider border-border bg-surface" },
  "unverified-anecdote": { text: "Unverified anecdote", className: "text-unverified border-border bg-surface" },
};

export function EvidenceChip({ label }: { label: EvidenceLabel }) {
  const meta = LABEL[label];
  return (
    <span className={cn("inline-flex rounded-sm border px-1.5 py-0.5 text-[11px] font-medium tracking-wide", meta.className)}>
      {meta.text}
    </span>
  );
}

export function sourceLinkKind(s: Source): string {
  switch (s.sourceType) {
    case "official-agreement":
      return "Official terms";
    case "help-centre":
      return "Provider help doc";
    case "regulatory":
      return "Regulator";
    case "journalism":
      return "Independent report";
    case "court":
      return "Court";
    case "filing":
      return "Filing";
    case "reddit":
    case "forum":
    case "review-platform":
    case "public-social":
      return "Merchant report";
    default:
      return sourceTypeLabel(s.sourceType);
  }
}

export function SourceLink({ id, source }: { id?: string; source?: Source }) {
  const s = source ?? (id ? getSource(id) : undefined);
  if (!s) return <span className="text-xs text-ink-subtle">Source pending</span>;
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline underline-offset-2"
    >
      <span className="receipt text-ink-subtle">{sourceLinkKind(s)}</span>
      {s.title} ↗
    </a>
  );
}

export function FindingCard({ finding }: { finding: OfficialFinding }) {
  return (
    <article className="border-t border-border py-4">
      <div className="flex items-center gap-2 mb-2">
        <EvidenceChip label="official-policy" />
        {finding.jurisdiction ? <span className="receipt">{finding.jurisdiction}</span> : null}
      </div>
      <h3 className="font-medium text-sm">{finding.title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{finding.paraphrase}</p>
      <p className="mt-3">
        <SourceLink id={finding.sourceId} />
      </p>
    </article>
  );
}

export function sourceTypeLabel(t: Source["sourceType"]): string {
  const map: Record<Source["sourceType"], string> = {
    "official-agreement": "Official agreement",
    "help-centre": "Help centre",
    regulatory: "Regulatory",
    journalism: "Journalism",
    reddit: "Reddit",
    forum: "Forum",
    "review-platform": "Review platform",
    "public-social": "Public social",
    court: "Court",
    filing: "Filing",
  };
  return map[t] ?? t;
}

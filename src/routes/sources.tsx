import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PROVIDERS, SOURCES_ALL, getProvider } from "@/data";
import { sourceTypeLabel } from "@/components/evidence";
import { Input, Label, Select } from "@/components/ui/input";

export const Route = createFileRoute("/sources")({
  head: () => ({ meta: [{ title: "Sources — Processor Risk Index" }] }),
  component: SourcesPage,
});

function SourcesPage() {
  const [q, setQ] = useState("");
  const [pid, setPid] = useState("all");
  const [typ, setTyp] = useState("all");
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return SOURCES_ALL.filter((s) => {
      if (pid !== "all" && s.providerId !== pid) return false;
      if (typ !== "all" && s.sourceType !== typ) return false;
      if (!needle) return true;
      return (
        s.title.toLowerCase().includes(needle) ||
        s.url.toLowerCase().includes(needle) ||
        s.notes.toLowerCase().includes(needle) ||
        (s.jurisdiction ?? "").toLowerCase().includes(needle)
      );
    });
  }, [q, pid, typ]);

  return (
    <div className="page-wrap py-10">
      <h1 className="font-display text-4xl">Sources</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        {SOURCES_ALL.length} cited documents and reports. Last checked dates are the research access date, not a claim
        that the live page is frozen in amber.
      </p>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div>
          <Label htmlFor="sq">Search</Label>
          <Input id="sq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, URL, note" />
        </div>
        <div>
          <Label htmlFor="sp">Provider</Label>
          <Select id="sp" value={pid} onChange={(e) => setPid(e.target.value)}>
            <option value="all">All</option>
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="st">Type</Label>
          <Select id="st" value={typ} onChange={(e) => setTyp(e.target.value)}>
            <option value="all">All</option>
            {[
              "official-agreement",
              "help-centre",
              "regulatory",
              "journalism",
              "reddit",
              "forum",
              "review-platform",
              "public-social",
              "court",
              "filing",
            ].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto hairline rounded-lg bg-bg-elevated">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-subtle border-b border-border">
              <th className="p-3">Provider</th>
              <th className="p-3">Source</th>
              <th className="p-3">Type</th>
              <th className="p-3">Date</th>
              <th className="p-3">Jurisdiction</th>
              <th className="p-3">Last checked</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const p = getProvider(s.providerId);
              return (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    {p ? (
                      <Link to="/processor/$slug" params={{ slug: p.slug }} className="hover:underline">
                        {p.name}
                      </Link>
                    ) : (
                      s.providerId
                    )}
                  </td>
                  <td className="p-3">
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                      {s.title}
                    </a>
                    <p className="text-xs text-ink-subtle mt-1">{s.topics.join(", ")}</p>
                  </td>
                  <td className="p-3">{sourceTypeLabel(s.sourceType)}</td>
                  <td className="p-3 tabular">{s.publicationDate ?? "—"}</td>
                  <td className="p-3">{s.jurisdiction ?? "—"}</td>
                  <td className="p-3 tabular">{s.accessedDate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-ink-subtle">{rows.length} shown.</p>
    </div>
  );
}

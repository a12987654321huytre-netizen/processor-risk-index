import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { searchProviders } from "@/data";
import { bandFor } from "@/data/scoring";
import { bandClass } from "@/components/score";
import { cn } from "@/lib/utils";

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const results = useMemo(() => (q.trim() ? searchProviders(q).slice(0, 8) : searchProviders("").slice(0, 8)), [q]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Search processors">
      <button type="button" className="absolute inset-0 bg-ink/30" aria-label="Close search" onClick={() => onOpenChange(false)} />
      <div className="relative mx-auto mt-[12vh] w-[min(560px,calc(100%-1.5rem))] rounded-lg border border-border bg-bg-elevated shadow-lift">
        <label className="sr-only" htmlFor="pri-search">
          Search processors
        </label>
        <input
          id="pri-search"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Stripe, PayPal, Adyen, Paddle…"
          className="w-full h-12 px-4 bg-transparent text-base border-b border-border focus-visible:outline-none"
        />
        <ul className="max-h-80 overflow-auto py-2">
          {results.length === 0 ? (
            <li className="px-4 py-6 text-sm text-ink-muted">No processors match.</li>
          ) : (
            results.map((p) => {
              const band = bandFor(p.publishedOverall);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-surface flex items-center gap-3"
                    onClick={() => {
                      onOpenChange(false);
                      void nav({ to: "/processor/$slug", params: { slug: p.slug } });
                    }}
                  >
                    <span className="tabular text-xs text-ink-subtle w-6">#{p.rank}</span>
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-ink-subtle">{p.types[0]}</span>
                    <span className={cn("ml-auto tabular text-sm", bandClass(band?.id))}>
                      {p.publishedOverall}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <p className="px-4 py-2 text-xs text-ink-subtle border-t border-border">Enter a name, alias, or type. Esc to close.</p>
      </div>
    </div>
  );
}

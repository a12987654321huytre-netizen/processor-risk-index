import { createFileRoute, Link } from "@tanstack/react-router";
import { VERTICALS } from "@/data/verticals";

export const Route = createFileRoute("/for/")({
  head: () => ({ meta: [{ title: "By business type — Processor Risk Index" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="page-wrap py-10">
      <h1 className="font-display text-4xl">By business type</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">Which lockout risks actually matter depends on what you sell.</p>
      <ul className="mt-8 grid gap-3 md:grid-cols-2">
        {VERTICALS.map((v) => (
          <li key={v.slug}>
            <Link to="/for/$vertical" params={{ vertical: v.slug }} className="block rounded-lg border border-border bg-bg-elevated p-4 hover:border-border-strong">
              <p className="text-xs uppercase tracking-wide text-ink-subtle">{v.eyebrow}</p>
              <p className="font-display text-xl mt-1">{v.title}</p>
              <p className="text-sm text-ink-muted mt-2">{v.dek}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

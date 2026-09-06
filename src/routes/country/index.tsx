import { createFileRoute, Link } from "@tanstack/react-router";
import { COUNTRIES } from "@/data";

export const Route = createFileRoute("/country/")({
  head: () => ({ meta: [{ title: "By merchant country — Processor Risk Index" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="page-wrap py-10">
      <h1 className="font-display text-4xl">By merchant country</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Merchants incorporated here — not shoppers paying from here. If a complete official onboarding list was not
        found, the country page says so.
      </p>
      <ul className="mt-8 grid gap-3 md:grid-cols-2">
        {COUNTRIES.map((c) => (
          <li key={c.slug}>
            <Link to="/country/$slug" params={{ slug: c.slug }} className="block rounded-lg border border-border bg-bg-elevated p-4 hover:border-border-strong">
              <p className="text-xs uppercase tracking-wide text-ink-subtle">{c.iso}</p>
              <p className="font-display text-xl mt-1">{c.name}</p>
              <p className="text-sm text-ink-muted mt-2">{c.note}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

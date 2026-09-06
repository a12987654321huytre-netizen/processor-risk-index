import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { VERTICALS, verticalBySlug } from "@/data/verticals";
import { filterProviders } from "@/data";
import { RankCards, RankTable } from "@/components/rank-table";

export const Route = createFileRoute("/for/$vertical")({
  loader: ({ params }) => {
    const v = verticalBySlug(params.vertical);
    if (!v) throw notFound();
    return { v };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData ? `${loaderData.v.title} processor risk — Processor Risk Index` : "Vertical",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const { v } = Route.useLoaderData();
  const rows = filterProviders({ model: v.model, sort: "risk-desc" }).slice(0, 15);
  return (
    <div className="page-wrap py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-accent font-medium">{v.eyebrow}</p>
      <h1 className="mt-2 font-display text-4xl">{v.title}</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">{v.dek}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {v.matters.map((m) => (
          <article key={m.title} className="rounded-md border border-border bg-bg-elevated p-4">
            <h2 className="font-medium">{m.title}</h2>
            <p className="mt-2 text-sm text-ink-muted">{m.body}</p>
          </article>
        ))}
      </div>
      <h2 className="mt-10 font-display text-2xl">Think twice if</h2>
      <ul className="mt-3 list-disc pl-5 text-sm text-ink-muted">
        {v.thinkTwice.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <h2 className="mt-10 font-display text-2xl">Processors in this index</h2>
      <p className="mt-2 text-sm text-ink-subtle">Sorted by lockout index, not by who pays for ads.</p>
      <div className="mt-4 hidden md:block">
        <RankTable rows={rows} compact />
      </div>
      <RankCards rows={rows} />
      <p className="mt-6 text-sm text-ink-muted">
        Other verticals:{" "}
        {VERTICALS.filter((x) => x.slug !== v.slug).map((x, i) => (
          <span key={x.slug}>
            {i ? " · " : null}
            <Link to="/for/$vertical" params={{ vertical: x.slug }} className="text-accent hover:underline">
              {x.title}
            </Link>
          </span>
        ))}
      </p>
    </div>
  );
}

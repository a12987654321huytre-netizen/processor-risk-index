import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { COUNTRIES, getProvider, rankProviders } from "@/data";
import { RankCards, RankTable } from "@/components/rank-table";

export const Route = createFileRoute("/country/$slug")({
  loader: ({ params }) => {
    const c = COUNTRIES.find((x) => x.slug === params.slug);
    if (!c) throw notFound();
    const processors = rankProviders(c.processorIds.map((id) => getProvider(id)).filter((p): p is NonNullable<typeof p> => Boolean(p)));
    return { c, processors };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `Payment processors for merchants in ${loaderData.c.name} — Processor Risk Index`
          : "Country",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const { c, processors } = Route.useLoaderData();
  return (
    <div className="page-wrap py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-accent font-medium">Merchant country · {c.iso}</p>
      <h1 className="mt-2 font-display text-4xl">{c.name}</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">{c.note}</p>
      <p className="mt-3 text-sm text-ink-subtle">
        This list is processors that merchants incorporated here can actually access, as sourced. It is not a list of
        countries customers can pay from.
      </p>
      {c.unverifiedNote ? <p className="mt-3 text-sm text-ink-muted">{c.unverifiedNote}</p> : null}
      <div className="mt-6 hidden md:block">
        <RankTable rows={processors} />
      </div>
      <RankCards rows={processors} />
      <p className="mt-6 text-sm text-ink-muted">
        Other countries:{" "}
        {COUNTRIES.filter((x) => x.slug !== c.slug).map((x, i) => (
          <span key={x.slug}>
            {i ? " · " : null}
            <Link to="/country/$slug" params={{ slug: x.slug }} className="text-accent hover:underline">
              {x.name}
            </Link>
          </span>
        ))}
      </p>
    </div>
  );
}

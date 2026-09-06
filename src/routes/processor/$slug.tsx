import { createFileRoute, notFound } from "@tanstack/react-router";
import { getProvider } from "@/data";
import { ProcessorView } from "@/components/processor-view";

export const Route = createFileRoute("/processor/$slug")({
  loader: ({ params }) => {
    const provider = getProvider(params.slug);
    if (!provider) throw notFound();
    return { provider };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.provider.name} lockout risk — Processor Risk Index`
          : "Processor — Processor Risk Index",
      },
      {
        name: "description",
        content: loaderData
          ? `${loaderData.provider.name} lockout risk ${loaderData.provider.publishedOverall} (#${loaderData.provider.rank} of 50). ${loaderData.provider.verdict.short.slice(0, 140)}`
          : "Processor dossier",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const { provider } = Route.useLoaderData();
  return <ProcessorView provider={provider} />;
}

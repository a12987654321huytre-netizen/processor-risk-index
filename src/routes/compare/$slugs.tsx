import { createFileRoute } from "@tanstack/react-router";
import { CompareView, parseCompareSlugs } from "@/components/compare-view";
import { getProvider } from "@/data";

export const Route = createFileRoute("/compare/$slugs")({
  loader: ({ params }) => ({ slugs: params.slugs }),
  head: ({ loaderData }) => {
    const names = parseCompareSlugs(loaderData?.slugs)
      .map((id) => getProvider(id)?.name)
      .filter(Boolean);
    return {
      meta: [
        {
          title: names.length
            ? `${names.join(" vs ")} lockout risk — Processor Risk Index`
            : "Compare — Processor Risk Index",
        },
      ],
    };
  },
  component: Page,
});

function Page() {
  const { slugs } = Route.useParams();
  return <CompareView ids={parseCompareSlugs(slugs)} />;
}

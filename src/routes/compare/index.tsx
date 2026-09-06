import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CompareView, parseCompareSlugs, toComparePath } from "@/components/compare-view";

type Search = { ids?: string };

export const Route = createFileRoute("/compare/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    ids: typeof s.ids === "string" ? s.ids : undefined,
  }),
  head: () => ({ meta: [{ title: "Compare processors — Processor Risk Index" }] }),
  component: Page,
});

function Page() {
  const { ids } = Route.useSearch();
  const nav = useNavigate();
  const parsed = parseCompareSlugs(ids);
  useEffect(() => {
    if (parsed.length >= 2) {
      void nav({ to: "/compare/$slugs", params: { slugs: toComparePath(parsed) }, replace: true });
    }
  }, [parsed, nav]);
  return <CompareView ids={parsed.length ? parsed : ["stripe", "paypal"]} />;
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { PROVIDERS, SOURCES_ALL } from "@/data";
import { LAST_VERIFIED } from "@/lib/site";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — Processor Risk Index" }] }),
  component: About,
});

function About() {
  return (
    <div className="page-wrap py-10 max-w-3xl">
      <h1 className="font-display text-4xl">About</h1>
      <p className="mt-4 text-ink-muted">
        Processor Risk Index is an independent research project about what happens when the company that takes your
        money decides it would rather not. It sits between serious payment-industry research, a consumer watchdog, and
        the friend who already learned this the expensive way.
      </p>
      <p className="mt-4 text-ink-muted">
        The larger category is payment-processor survivability. Rankings are the front door. The useful questions are:
        how risky is the processor, how dependent are you, what happens if it disappears tomorrow, and what should sit
        beside it.
      </p>
      <p className="mt-4 text-ink-muted">
        v1 is the global top {PROVIDERS.length}: every provider is ranked. Currently {SOURCES_ALL.length} cited
        sources. Last research pass: {LAST_VERIFIED}. Research status describes how strong the evidence is — it does
        not decide whether a provider appears. Merchant-country lists are sourced, never guessed. Where a complete
        official list was not found, the dossier says so and Evidence Confidence drops.
      </p>
      <p className="mt-4 text-ink-muted">
        The UI can be cheeky. The data cannot. We do not convert allegations into facts. They can buy an ad. They cannot
        buy a better score.
      </p>
      <ul className="mt-6 text-sm space-y-2">
        <li>
          <Link to="/methodology" className="text-accent hover:underline">
            Methodology
          </Link>
        </li>
        <li>
          <Link to="/sources" className="text-accent hover:underline">
            Source database
          </Link>
        </li>
        <li>
          <Link to="/corrections" className="text-accent hover:underline">
            Corrections and right of reply
          </Link>
        </li>
      </ul>
    </div>
  );
}

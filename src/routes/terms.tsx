import { createFileRoute, Link } from "@tanstack/react-router";
import { DISCLAIMER } from "@/lib/site";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms — Processor Risk Index" }] }),
  component: Terms,
});

function Terms() {
  return (
    <div className="page-wrap py-10 max-w-3xl">
      <h1 className="font-display text-4xl">Terms of use</h1>
      <p className="mt-4 text-ink-muted">{DISCLAIMER}</p>
      <p className="mt-4 text-ink-muted">
        You may cite PRI with a link. You may not scrape the dataset to train a competing “safety ranking” that sells
        placement. Provider names are trademarks of their owners. PRI is not affiliated with, endorsed by, or a
        substitute for any processor.
      </p>
      <p className="mt-4 text-ink-muted">
        Tools on this site do not provide methods for evading fraud, KYC or sanctions systems. Describe the business you
        actually run.
      </p>
      <p className="mt-4 text-sm">
        See also{" "}
        <Link to="/privacy" className="text-accent hover:underline">
          Privacy
        </Link>{" "}
        and{" "}
        <Link to="/methodology" className="text-accent hover:underline">
          Methodology
        </Link>
        .
      </p>
    </div>
  );
}

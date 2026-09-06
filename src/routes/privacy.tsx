import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy — Processor Risk Index" }] }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="page-wrap py-10 max-w-3xl">
      <h1 className="font-display text-4xl">Privacy</h1>
      <p className="mt-4 text-ink-muted">
        This site does not require an account. How-cooked answers, escape-hatch drafts and correction drafts are stored
        in your browser with localStorage. They are not sent to a PRI server in this version.
      </p>
      <p className="mt-3 text-ink-muted">
        We do not sell personal data. We do not run a merchant-data brokerage. Hosting and preview infrastructure may
        collect ordinary server logs. Do not paste card numbers, government IDs or customer PII into the tools.
      </p>
      <p className="mt-3 text-sm text-ink-subtle">Last updated 6 September 2026.</p>
    </div>
  );
}

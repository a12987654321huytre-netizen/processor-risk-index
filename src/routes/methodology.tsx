import { createFileRoute, Link } from "@tanstack/react-router";
import { DIMENSION_META, RISK_BANDS, WEIGHTS } from "@/data/scoring";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "Methodology — Processor Risk Index" },
      {
        name: "description",
        content: "How the Processor Risk Index scores shutdown risk, funds holds, underwriting, appeals, policy, incidents and dependency.",
      },
    ],
  }),
  component: Methodology,
});

function Methodology() {
  return (
    <div className="page-wrap py-10 max-w-3xl">
      <p className="text-xs uppercase tracking-[0.18em] text-accent font-medium">The boring bit that can bankrupt you</p>
      <h1 className="mt-2 font-display text-4xl">Methodology</h1>
      <p className="mt-4 text-ink-muted">
        The index measures comparative merchant lockout exposure: how badly things can go if a processor decides it no
        longer likes an account. It is not a probability of suspension, a credit rating, an allegation of wrongdoing, or
        a judgement of financial stability.
      </p>

      <h2 className="mt-10 font-display text-2xl">What it does not measure</h2>
      <ul className="mt-3 list-disc pl-5 text-ink-muted text-sm space-y-1">
        <li>Fees, FX, authorisation rates, or uptime.</li>
        <li>Whether a company is “good” or “evil”.</li>
        <li>Whether any particular merchant will be reviewed tomorrow.</li>
        <li>Customer-side payment acceptance (“shoppers in country X can pay”).</li>
      </ul>

      <h2 className="mt-10 font-display text-2xl">The formula</h2>
      <p className="mt-3 text-sm text-ink-muted">
        Each dimension is scored 0–10 (higher = more exposure). Overall is the weighted sum times 10, rounded to the
        nearest whole number. We do not hand-override totals.
      </p>
      <pre className="mt-4 rounded-md bg-ink text-bg p-4 text-xs overflow-x-auto font-mono">
        {`overall = round((
  suspension × ${WEIGHTS.suspension}
  + fundsHold × ${WEIGHTS.fundsHold}
  + underwriting × ${WEIGHTS.underwriting}
  + appeal × ${WEIGHTS.appeal}
  + policy × ${WEIGHTS.policy}
  + incidents × ${WEIGHTS.incidents}
  + dependency × ${WEIGHTS.dependency}
) × 10)`}
      </pre>
      <ul className="mt-4 grid gap-3">
        {DIMENSION_META.map((d) => (
          <li key={d.key} className="border border-border rounded-md p-3">
            <p className="font-medium text-sm">
              {d.label} · {d.weightPct}%
            </p>
            <p className="text-sm text-ink-muted mt-1">{d.help}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-display text-2xl">Risk bands</h2>
      <ul className="mt-3 grid gap-2 text-sm">
        {RISK_BANDS.map((b) => (
          <li key={b.id} className="flex flex-wrap gap-2 items-baseline">
            <span className="tabular w-16">{b.min}–{b.max}</span>
            <span className="font-medium">{b.label}</span>
            <span className="text-ink-subtle">{b.cheeky}</span>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-display text-2xl">Source hierarchy</h2>
      <ol className="mt-3 list-decimal pl-5 text-sm text-ink-muted space-y-1">
        <li>Merchant agreements, legal terms, regulator docs, court filings, card-network rules, financial filings.</li>
        <li>Provider help centres and restricted-business documentation.</li>
        <li>Established journalism and detailed merchant case studies.</li>
        <li>Multiple independent merchant reports, forums, BBB/Trustpilot patterns.</li>
        <li>Isolated social complaints and unsupported claims.</li>
      </ol>
      <p className="mt-3 text-sm text-ink-muted">A dramatic Tier-5 story cannot override clear Tier-1 evidence.</p>

      <h2 className="mt-10 font-display text-2xl">Bias, duplicates, recency</h2>
      <p className="mt-3 text-sm text-ink-muted">
        Huge processors generate more complaints because they have more customers. Where we cannot normalise for
        merchant base, we say so. Incident weight is capped at 8% so the internet cannot dominate the score. The same
        story on Reddit, Trustpilot and a blog is one incident. Sources from the last 12 months weigh most; 5+ years is
        historical unless the clause is still live.
      </p>
      <p className="mt-3 text-sm text-ink-muted">
        An initial suspension that was reversed is not scored like a permanent closure. Merchant-responsibility flags
        (confirmed policy violations, fake KYC) keep “someone on Reddit got banned” from becoming “processor bad”.
      </p>

      <h2 className="mt-10 font-display text-2xl">Why types are not equivalent</h2>
      <p className="mt-3 text-sm text-ink-muted">
        A gateway that never holds card settlement is not a Merchant of Record. Paddle and Adyen can both result in a
        customer paying. Only one of them is the merchant. Gateways score lower on funds-hold when they do not sit in
        the money. MoRs score high on dependency because checkout, tax and subscriptions can all vanish together.
        Same-app banking plus acquiring (Revolut, Airwallex, Chase QuickAccept) raises blast radius.
      </p>

      <h2 className="mt-10 font-display text-2xl">Evidence confidence</h2>
      <p className="mt-3 text-sm text-ink-muted">
        Confidence is not risk. A processor can be Moderate risk with Low confidence if the current MSA is private. We
        would rather mark research partial than invent a clause.
      </p>

      <h2 className="mt-10 font-display text-2xl">Corrections</h2>
      <p className="mt-3 text-sm text-ink-muted">
        Processors and merchants can submit evidence. Nothing is auto-published. Evidence beats outrage in either
        direction. Processors cannot buy a score change. There is no premium listing.
      </p>
      <p className="mt-4">
        <Link to="/corrections" className="text-accent hover:underline">
          Think we got something wrong?
        </Link>
      </p>
    </div>
  );
}

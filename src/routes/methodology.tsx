import { createFileRoute, Link } from "@tanstack/react-router";
import { DIMENSION_META, RISK_BANDS, WEIGHTS } from "@/data/scoring";
import { RUBRIC } from "@/data/rubric";
import { RESEARCH_STATS } from "@/data";
import { TYPE_BASELINES } from "@/data/priors";
import { COMMERCIAL_FIREWALL } from "@/lib/commercial";
import { LAST_RECALCULATED } from "@/lib/site";
import { ResearchTracker } from "@/components/research-tracker";

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
      <p className="text-xs uppercase tracking-[0.18em] text-accent font-medium">The boring bit, on purpose</p>
      <h1 className="mt-2 font-display text-4xl">Methodology</h1>
      <p className="mt-4 text-ink-muted">
        The index measures comparative merchant lockout exposure: how badly things can go if a processor decides it no
        longer likes an account. It is not a probability of suspension, a credit rating, an allegation of wrongdoing, or
        a judgement of financial stability. Band labels are presentation. The numeric scores did not change.
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

      <h2 className="mt-10 font-display text-2xl">Lesser-known providers are not ‘quiet because English Reddit is quiet’</h2>
      <p className="mt-3 text-sm text-ink-muted">
        English-language internet visibility is not research quality. For providers whose merchant base lives
        elsewhere we search local-language help centres, regional review platforms, regulator/ABF paths, and
        translated official terms: Dutch and German for Mollie, Italian for Nexi, Indian merchant forums and
        consumer-complaint sites for Razorpay and PayU, Portuguese Reclame Aqui plus Spanish T&Cs for Mercado
        Pago, Chinese Antom/Weixin docs for Alipay and WeChat Pay. Finding nothing in those languages is recorded
        as a gap — it is not treated as a low-risk score.
      </p>

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

      <h2 className="mt-10 font-display text-2xl">Two different numbers</h2>
      <p className="mt-3 text-sm text-ink-muted">
        The Risk Index is PRI’s current assessment of lockout exposure. Evidence Confidence is how strongly the
        available research supports that assessment. They are not the same number. A provider with Risk 59 and
        Confidence 51 is still ranked. The lower confidence warns you the estimate is less certain.
      </p>
      <p className="mt-3 text-sm text-ink-muted">
        A ranking is not an established factual probability of account suspension. It is the current evidence-based
        assessment, and it is allowed to move when better evidence arrives.
      </p>

      <h2 className="mt-10 font-display text-2xl">Everyone is ranked</h2>
      <p className="mt-3 text-sm text-ink-muted">
        The product is the global top {RESEARCH_STATS.total}. All {RESEARCH_STATS.total} receive a Risk Index, a
        numerical rank from #1 to #{RESEARCH_STATS.total}, dimension scores, Evidence Confidence, research status,
        sources and notes. Rank 1 is the highest lockout-risk assessment in the current index — not a prize, not a
        prediction. Coverage does not wait on certainty.
      </p>
      <div className="mt-4">
        <ResearchTracker />
      </div>
      <ul className="mt-3 list-disc pl-5 text-sm text-ink-muted space-y-1">
        <li>
          <strong>Verified</strong> — unusually strong evidence: current agreement covering termination,
          holds/reserves, restricted businesses, geography and support/appeal; at least three official sources (or one
          comprehensive agreement); mechanical confidence ≥ 70.
        </li>
        <li>
          <strong>Provisional</strong> — current best evidence-based assessment; important research gaps remain.
        </li>
        <li>
          <strong>Research in progress</strong> — smaller body of evidence; the score may move as research continues.
        </li>
      </ul>
      <p className="mt-3 text-sm text-ink-muted">
        Research status is metadata. It does not decide whether a provider appears on the leaderboard. We target five
        independent merchant incidents. We do not invent them. Missing community evidence lowers confidence instead of
        deleting the row.
      </p>

      <h2 className="mt-10 font-display text-2xl">Missing evidence</h2>
      <p className="mt-3 text-sm text-ink-muted">
        If a specific dimension lacks an official clause, we do not leave the overall blank and we do not secretly make
        up a number. Known components are scored from cited evidence using the same rubric as every other provider.
        The official-coverage shortfall reduces Evidence Confidence (up to 35 of the 100-point formula). The dossier
        lists the gap.
      </p>
      <p className="mt-3 text-sm text-ink-muted">
        When a dimension would otherwise have no basis at all, researchers use a published provider-type baseline
        rather than inventing a clause or inserting a dash. Neutral prior on each 0–10 dimension is 5. Type baselines
        replace that prior where architecture is known: a gateway does not sit in card settlement, so its funds-hold
        baseline is lower than a PayFac’s; a Merchant of Record has a higher dependency baseline because checkout, tax
        and payouts can vanish together. Live dimension scores that already rest on cited evidence are not overwritten
        with the baseline after the fact.
      </p>
      <ul className="mt-3 list-disc pl-5 text-sm text-ink-muted space-y-1">
        {Object.entries(TYPE_BASELINES).map(([type, d]) => (
          <li key={type}>
            <span className="font-medium">{type}</span> — suspension {d.suspension}, funds-hold {d.fundsHold},
            underwriting {d.underwriting}, appeal {d.appeal}, policy {d.policy}, incidents {d.incidents}, dependency{" "}
            {d.dependency}
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-display text-2xl">Rankings are allowed to move</h2>
      <p className="mt-3 text-sm text-ink-muted">
        Last recalculated {LAST_RECALCULATED}. Scores update when merchant agreements change, reserve terms change,
        support policies change, incidents are documented or resolved, better jurisdictional evidence appears, or
        mistakes are corrected. That is a feature. A provider at #14 with confidence 46 can become #24 with confidence
        81 after more research. The next pass will show place movement against this snapshot.
      </p>

      <h2 className="mt-10 font-display text-2xl">Research queue</h2>
      <p className="mt-3 text-sm text-ink-muted">
        All {RESEARCH_STATS.total} remain under active research. Additional work is queued by lowest Evidence
        Confidence first, then provider prominence, missing critical official documents, geographic imbalance, and
        thin merchant evidence. The goal is to raise confidence across the index, not to decide who is allowed a rank.
      </p>

      <h2 className="mt-10 font-display text-2xl">Scoring anchors</h2>
      <p className="mt-3 text-sm text-ink-muted">
        Decimals on a dimension come from averaging four subcomponents — not from typing 7.2 because it felt right.
        Overall remains a whole number / 100.
      </p>
      <ul className="mt-4 grid gap-3">
        {(Object.keys(RUBRIC) as (keyof typeof RUBRIC)[]).map((k) => (
          <li key={k} className="border border-border rounded-md p-3">
            <p className="font-medium text-sm">{RUBRIC[k].label}</p>
            <ul className="mt-2 space-y-1 text-sm text-ink-muted">
              {RUBRIC[k].bands.map((b) => (
                <li key={b.title}>
                  <span className="tabular text-ink">{b.title}</span> — {b.text}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-display text-2xl">Evidence confidence</h2>
      <p className="mt-3 text-sm text-ink-muted">
        Confidence is not risk. It is mechanical, out of 100:
      </p>
      <ul className="mt-3 list-disc pl-5 text-sm text-ink-muted space-y-1">
        <li>Official policy coverage — 35 (termination 7, holds 7, restricted 6, payouts 5, onboarding 5, appeal/support 5)</li>
        <li>Independent evidence — 25 (0 reports = 0; 1 = 5; 2–3 = 10; 4–6 = 17; 7–10 = 22; 10+ = 25). Reposts are not extra incidents.</li>
        <li>Recency — 15 (current official docs and reports inside 24 months score highest)</li>
        <li>Jurisdiction coverage — 10</li>
        <li>Evidence diversity — 10</li>
        <li>Contradiction resolution — 5 (we look for reversals on purpose)</li>
      </ul>
      <p className="mt-3 text-sm text-ink-muted">
        Mechanical bands: 85–100 high · 70–84 good · 50–69 medium · 30–49 low · 0–29 very low. Public labels on the
        leaderboard: High ≥ 70, Medium 50–69, Low under 50. We would rather drop Evidence Confidence than invent a
        clause.
      </p>

      <h2 className="mt-10 font-display text-2xl">Independence</h2>
      <p className="mt-3 text-sm text-ink-muted">{COMMERCIAL_FIREWALL} Referral links, if they ever exist, cannot feed the ranking engine.</p>

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

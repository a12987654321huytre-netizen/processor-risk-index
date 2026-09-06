import type { BusinessModel } from "./types";

export interface VerticalPage {
  slug: string;
  title: string;
  model: BusinessModel;
  eyebrow: string;
  dek: string;
  matters: { title: string; body: string }[];
  thinkTwice: string[];
}

export const VERTICALS: VerticalPage[] = [
  {
    slug: "digital-products",
    title: "Digital products",
    model: "digital-downloads",
    eyebrow: "Intangible goods",
    dek: "No tracking number, no ‘proof of postage’. Processors treat delivery evidence as the whole argument — and chargebacks as the whole risk.",
    matters: [
      { title: "Delivery proof", body: "Licence keys, download logs and login records are what a review team asks for. If you cannot produce them, the hold looks like a fraud hold." },
      { title: "Refund disputes", body: "‘I didn’t get the file’ is cheap to file and expensive to fight. Clear refund windows reduce both chargebacks and ‘restricted category’ flags." },
      { title: "Intangible-product policies", body: "Several AUPs list digital goods as restricted or as a different underwriting track. Prior approval is not permanent approval." },
    ],
    thinkTwice: ["New accounts with a sudden catalogue of downloads", "High-ticket info products", "Content a later AUP revision might dislike"],
  },
  {
    slug: "saas",
    title: "SaaS",
    model: "saas",
    eyebrow: "Recurring software",
    dek: "The risk is not the 2.9%. It is that billing, tax, tokens and the customer relationship can all sit in one vendor — especially a Merchant of Record.",
    matters: [
      { title: "Subscription portability", body: "If the processor is also the merchant, customers contracted with them. Migration is a re-sale, not an export." },
      { title: "Stored payment credentials", body: "Card-on-file is convenient until the vault is not yours. Ask, in writing, whether tokens can leave." },
      { title: "Recurring-revenue dependency", body: "A 120-day hold on a monthly SaaS is a cash-flow event. A hold on annual plans paid last week is an existential one." },
    ],
    thinkTwice: ["MoR as 100% of billing", "Annual plans with thin cash", "Using the same family as ‘primary’ and ‘backup’ (Stripe + Lemon Squeezy)"],
  },
  {
    slug: "ecommerce",
    title: "Ecommerce",
    model: "ecommerce",
    eyebrow: "Physical goods online",
    dek: "Fulfilment lag is the underwriting variable most store owners never read. Ship fast, document faster, and do not surprise the processor with a new SKU category.",
    matters: [
      { title: "Fulfilment windows", body: "Future-dated or made-to-order goods look like delayed delivery. Some aggregators restrict fulfilment over a small number of days." },
      { title: "Chargebacks on cards", body: "Card-not-present retail lives and dies on descriptor, tracking and refunds. Reserves often track chargeback ratios." },
      { title: "Platform coupling", body: "Shopify Payments is payments plus the shop. A payments hold can still leave the store up — or not, depending on the theme of the week." },
    ],
    thinkTwice: ["Dropshipping with long ship times", "Sudden paid-ads volume on a new store", "Restricted categories hidden in a ‘general merchandise’ onboarding"],
  },
  {
    slug: "high-ticket",
    title: "High ticket",
    model: "high-ticket",
    eyebrow: "Large average order value",
    dek: "One sale can look like a spike, a mule, or a whale. Underwriting that was fine at $80 AOV is a different conversation at $8,000.",
    matters: [
      { title: "Transaction spikes", body: "A single high-ticket charge on a quiet account is a classic review trigger — officially, in several help centres." },
      { title: "Fraud reviews", body: "Issuers dispute expensive charges more aggressively. Processors pre-empt that with holds and 3-D Secure." },
      { title: "Reserves", body: "Rolling and minimum reserves exist to survive a chargeback on a large ticket after you have already spent the money." },
    ],
    thinkTwice: ["First $10k charge on a 10-day-old account", "Services with delayed delivery (coaching, travel, events)", "No backup acquirer and no operating cash"],
  },
  {
    slug: "subscriptions",
    title: "Subscriptions",
    model: "subscriptions",
    eyebrow: "Recurring billing",
    dek: "Recurring is a gift to cashflow and a hostage situation if the vault, the descriptor and the merchant of record are the same company.",
    matters: [
      { title: "Involuntary churn vs lockout", body: "A processor shutdown is not a failed renewal. It is every renewal. Plan a second vault before the first one sulks." },
      { title: "Descriptor and family of charges", body: "Subscription upsells that surprise the cardholder create chargebacks that look like fraud, not buyer’s remorse." },
      { title: "MoR vs direct", body: "MoR handles tax. It also handles the customer. Direct acquiring handles neither tax nor your funeral." },
    ],
    thinkTwice: ["Annual billing on a MoR with a six-month post-term retain", "Free trials that convert on a new MID", "One processor for every geo"],
  },
  {
    slug: "freelancers",
    title: "Freelancers",
    model: "freelancers",
    eyebrow: "Invoices and retainers",
    dek: "Personal accounts used commercially, first large inbound payments, and wallets that look like banks. The pattern is ugly and very well documented.",
    matters: [
      { title: "Personal vs business", body: "Several user agreements treat commercial use of a personal account as a limitation event. Open the business product on purpose." },
      { title: "First large inbound", body: "A $20k invoice into a quiet wallet is a review, not a payday. Tell the processor first or split the payment." },
      { title: "Wallet ≠ bank", body: "Payoneer, PayPal and similar 180-day access limitations are contractual. Keep a real current account." },
    ],
    thinkTwice: ["Parking six figures in a receiving wallet", "Invoicing from a personal PayPal", "No second way for the client to pay"],
  },
  {
    slug: "marketplaces",
    title: "Marketplaces",
    model: "marketplaces",
    eyebrow: "Multi-party money",
    dek: "You are underwriting your sellers. The processor is underwriting you underwriting your sellers. That is two KYC stacks and one shared freeze.",
    matters: [
      { title: "Platform payments", body: "Connect-style products and wallet platforms can pause the platform and every seller together." },
      { title: "Seller misconduct", body: "A prohibited seller is your AUP problem. Splitting flow of funds does not split responsibility." },
      { title: "Payout timing", body: "Holding seller funds ‘just in case’ is how platforms become money-transmitters. Read that licence." },
    ],
    thinkTwice: ["Using a consumer wallet as the marketplace ledger", "Onboarding sellers in countries you cannot actually serve", "No second payout rail"],
  },
];

export function verticalBySlug(slug: string): VerticalPage | undefined {
  return VERTICALS.find((v) => v.slug === slug);
}

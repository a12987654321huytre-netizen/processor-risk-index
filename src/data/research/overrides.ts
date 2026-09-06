import type { EscalationQuality, SupportAccess, YesNoVaries } from "../types";

export type SnapshotOverride = {
  humanSupport?: YesNoVaries;
  supportAccess: SupportAccess;
  escalationQuality: EscalationQuality;
  note?: string;
};

/**
 * Fact-checked support fields. Anything not listed stays `unknown`
 * rather than inheriting an unsourced Yes/No from the first pass.
 */
export const SUPPORT_OVERRIDES: Record<string, SnapshotOverride> = {
  stripe: {
    humanSupport: true,
    supportAccess: "24-7-phone-chat-email",
    escalationQuality: "poor",
    note: "Stripe states all customers receive 24×7 phone, email and chat. Lockout appeals are still widely reported as templated; reinstatement is the exception.",
  },
  paypal: {
    humanSupport: true,
    supportAccess: "phone-available",
    escalationQuality: "mixed",
    note: "Phone and supervisor escalation exist. Permanent limitations often stick even when funds are released early.",
  },
  square: {
    humanSupport: true,
    supportAccess: "phone-available",
    escalationQuality: "mixed",
    note: "SMB phone support is real. Post-deactivation holds still run on Square’s clock.",
  },
  "shopify-payments": {
    humanSupport: "varies",
    supportAccess: "varies-by-plan",
    escalationQuality: "poor",
    note: "Shopify Payments risk sits behind Shopify Support. Merchant reports in 2025–26 describe chatbot loops on payout holds.",
  },
  adyen: {
    humanSupport: true,
    supportAccess: "account-manager-qualifying",
    escalationQuality: "good",
    note: "Enterprise account management. Not a self-serve SMB support model.",
  },
  worldpay: {
    humanSupport: true,
    supportAccess: "account-manager-qualifying",
    escalationQuality: "mixed",
  },
  checkout: {
    humanSupport: true,
    supportAccess: "account-manager-qualifying",
    escalationQuality: "mixed",
  },
  braintree: {
    humanSupport: "varies",
    supportAccess: "chat-email",
    escalationQuality: "mixed",
    note: "Braintree is a PayPal service. Support quality tracks the PayPal family more than a standalone acquirer.",
  },
  paddle: {
    humanSupport: true,
    supportAccess: "ticket-only",
    escalationQuality: "poor",
    note: "Public seller support is sellers@paddle.com, weekday hours. A 2026 merchant report describes risk and support teams contradicting each other.",
  },
  mollie: {
    humanSupport: true,
    supportAccess: "chat-email",
    escalationQuality: "mixed",
  },
  airwallex: {
    humanSupport: "varies",
    supportAccess: "chat-email",
    escalationQuality: "mixed",
  },
  payoneer: {
    humanSupport: "varies",
    supportAccess: "chat-email",
    escalationQuality: "mixed",
  },
  revolut: {
    humanSupport: true,
    supportAccess: "chat-email",
    escalationQuality: "mixed",
  },
  sumup: {
    humanSupport: true,
    supportAccess: "phone-available",
    escalationQuality: "mixed",
  },
  fastspring: {
    humanSupport: true,
    supportAccess: "ticket-only",
    escalationQuality: "insufficient-evidence",
  },
  "lemon-squeezy": {
    humanSupport: "varies",
    supportAccess: "chat-email",
    escalationQuality: "mixed",
  },
  nuvei: {
    humanSupport: true,
    supportAccess: "account-manager-qualifying",
    escalationQuality: "mixed",
  },
  helcim: {
    humanSupport: true,
    supportAccess: "phone-available",
    escalationQuality: "good",
    note: "Human underwriting is the product pitch. Still a PayFac on Elavon — not a second rail from Elavon.",
  },
  worldline: {
    humanSupport: true,
    supportAccess: "account-manager-qualifying",
    escalationQuality: "mixed",
  },
  nexi: {
    humanSupport: true,
    supportAccess: "account-manager-qualifying",
    escalationQuality: "mixed",
  },
};

export const GATEWAY_STRUCTURAL =
  "Structural note: gateway risk is not equivalent to acquiring risk. A low funds-hold score here usually means this company does not sit in the settlement money — not that it is a safer Stripe.";

export function structuralNoteFor(id: string, types: string[]): string | null {
  if (id === "cybersource" || id === "authorize-net" || types.includes("gateway")) {
    if (types.includes("gateway") && !types.includes("payment-aggregator") && !types.includes("direct-acquirer")) {
      return GATEWAY_STRUCTURAL;
    }
  }
  return null;
}

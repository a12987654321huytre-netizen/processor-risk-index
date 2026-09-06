export type InfraKind = "ownership" | "processing" | "acquiring" | "unknown";

export type InfraGroup = {
  id: string;
  label: string;
  members: string[];
  kind: InfraKind;
  warning: string;
};

export const INFRASTRUCTURE: InfraGroup[] = [
  {
    id: "stripe-family",
    label: "Stripe family",
    members: ["stripe", "shopify-payments", "lemon-squeezy"],
    kind: "processing",
    warning:
      "Shopify Payments is often Stripe underneath, by jurisdiction. Lemon Squeezy LLC provides Stripe Managed Payments. Two logos can still share a risk engine.",
  },
  {
    id: "paypal-family",
    label: "PayPal family",
    members: ["paypal", "braintree"],
    kind: "ownership",
    warning: "Braintree is a PayPal service. A Braintree ‘backup’ next to PayPal is not two processors.",
  },
  {
    id: "elavon-family",
    label: "Elavon family",
    members: ["elavon", "helcim"],
    kind: "acquiring",
    warning: "Helcim is a PayFac sponsored by Elavon. Elavon is the acquirer of record. Ownership of a logo is not automatically the same underwriting file — here the acquiring dependency is documented.",
  },
  {
    id: "mollie-gc",
    label: "Mollie / GoCardless",
    members: ["mollie", "gocardless"],
    kind: "ownership",
    warning: "Mollie acquired GoCardless. Bank-debit next to Mollie cards may still sit in one group.",
  },
  {
    id: "fiserv-clover",
    label: "Fiserv / Clover",
    members: ["fiserv"],
    kind: "ownership",
    warning: "Clover is a Fiserv product. PRI indexes Fiserv/Clover as one dossier — do not treat a Clover terminal as a second acquirer from Fiserv.",
  },
  {
    id: "paysafe-skrill",
    label: "Paysafe / Skrill",
    members: ["paysafe"],
    kind: "ownership",
    warning: "Skrill sits inside Paysafe. A Skrill wallet next to Paysafe acquiring is not automatically independent infrastructure.",
  },
  {
    id: "verifone-2co",
    label: "Verifone / 2Checkout",
    members: ["2checkout"],
    kind: "ownership",
    warning: "2Checkout (now Verifone) is a Verifone product. Ownership is documented; identical risk engines are not assumed.",
  },
  {
    id: "nexi-nets",
    label: "Nexi / Nets",
    members: ["nexi"],
    kind: "ownership",
    warning: "Nexi acquired Nets. Regional brands in the Nexi group are not automatically a second acquirer.",
  },
];

export function infraWarnings(ids: string[]): InfraGroup[] {
  return INFRASTRUCTURE.filter((g) => {
    const hit = g.members.filter((m) => ids.includes(m));
    return hit.length >= 2;
  });
}

export function infraFor(id: string): InfraGroup[] {
  return INFRASTRUCTURE.filter((g) => g.members.includes(id) && g.members.length >= 2);
}

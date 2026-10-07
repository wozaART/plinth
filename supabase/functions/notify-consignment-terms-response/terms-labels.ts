// Mirrors the question labels in lib/consignment-terms.ts (Next.js side) —
// duplicated here, like every other edge function's email template,
// because edge functions are bundled standalone. If a question id is
// renamed there, update LABELS here too; an unknown id still prints (as
// its raw key) rather than silently dropping data from the admin email.

const LABELS: Record<string, string> = {
  written_agreement: "Written consignment agreement",
  commission_percent: "Commission %",
  commission_varies: "Commission varies",
  commission_extras: "Commission on framing/delivery",
  payout_trigger: "Payout trigger",
  payout_days: "Payout days",
  instalments: "Instalments",
  refund_handling: "Refund handling",
  discount_absorbed_by: "Discount absorbed by",
  discount_consent: "Discount consent",
  discount_limit_percent: "Discount limit %",
  gallery_vat: "Gallery VAT registered",
  prices_include_vat: "Prices include VAT",
  vat_base: "VAT base",
  artists_vat: "Artists VAT registered",
  artists_vat_effect: "Artist VAT effect",
  notes: "Notes",
};

export const TERMS_QUESTIONS = LABELS;

export function answersToRows(answers: Record<string, string>): { label: string; value: string }[] {
  return Object.entries(answers)
    .filter(([, value]) => value)
    .map(([id, value]) => ({ label: LABELS[id] || id, value }));
}

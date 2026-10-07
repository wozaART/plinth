// Questions for the public consignment terms form at /consignment-terms.
// The form renders from this list and the server action validates against it,
// so adding or rewording a question is a change to this file only. Answers
// are stored as JSON keyed by question id; never reuse an id for a new meaning.

export type TermsOption = { value: string; label: string };

export type TermsQuestion = {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  /** Only ask when another choice question has this answer. */
  showIf?: { id: string; equals: string };
} & (
  | { kind: "text" | "longtext"; placeholder?: string }
  | { kind: "number"; min: number; max: number; suffix: string }
  | { kind: "choice"; options: TermsOption[] }
);

export type TermsSection = { id: string; title: string; intro?: string; questions: TermsQuestion[] };

const UNDECIDED: TermsOption = { value: "undecided", label: "Not decided yet" };
const UNSURE: TermsOption = { value: "unsure", label: "Not sure" };

export const TERMS_SECTIONS: TermsSection[] = [
  {
    id: "about",
    title: "About you",
    questions: [
      { id: "gallery_name", kind: "text", label: "Gallery name", required: true },
      { id: "contact_name", kind: "text", label: "Your name", required: true },
      { id: "contact_role", kind: "text", label: "Your role", placeholder: "e.g. Gallery director" },
      { id: "contact_email", kind: "text", label: "Your email", required: true, placeholder: "you@gallery.com" },
      {
        id: "written_agreement",
        kind: "choice",
        label: "Do you have a written consignment agreement with artists?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "in_progress", label: "Being drafted" },
          { value: "no", label: "No" },
        ],
      },
    ],
  },
  {
    id: "commission",
    title: "Commission",
    questions: [
      {
        id: "commission_percent",
        kind: "number",
        label: "What percentage does the gallery keep on a sale?",
        min: 0,
        max: 100,
        suffix: "%",
        required: true,
      },
      {
        id: "commission_varies",
        kind: "choice",
        label: "Is it the same for every artist and every show?",
        options: [
          { value: "same", label: "Same for everyone" },
          { value: "by_artist", label: "Varies by artist" },
          { value: "by_show", label: "Varies by show" },
          { value: "both", label: "Varies by artist and by show" },
          UNDECIDED,
        ],
      },
      {
        id: "commission_extras",
        kind: "choice",
        label: "Is commission taken on framing or delivery charged to the buyer?",
        options: [
          { value: "none", label: "No, on the artwork price only" },
          { value: "framing", label: "On framing too" },
          { value: "delivery", label: "On delivery too" },
          { value: "both", label: "On framing and delivery" },
          UNDECIDED,
        ],
      },
    ],
  },
  {
    id: "payout",
    title: "Paying the artist",
    questions: [
      {
        id: "payout_trigger",
        kind: "choice",
        label: "What starts the clock on paying the artist?",
        required: true,
        options: [
          { value: "paid_in_full", label: "The buyer pays in full" },
          { value: "month_end", label: "The end of the month of the sale" },
          { value: "exhibition_close", label: "The exhibition closes" },
          UNDECIDED,
        ],
      },
      {
        id: "payout_days",
        kind: "number",
        label: "How many days after that is the artist paid?",
        min: 0,
        max: 365,
        suffix: "days",
      },
      {
        id: "instalments",
        kind: "choice",
        label: "If the buyer pays a deposit or in instalments, when is the artist paid?",
        options: [
          { value: "in_parts", label: "In parts, as each payment arrives" },
          { value: "at_end", label: "Once, after the final payment" },
          { value: "no_instalments", label: "We don't take deposits or instalments" },
          UNDECIDED,
        ],
      },
      {
        id: "refund_handling",
        kind: "longtext",
        label: "What happens to the artist's payout if a sale is refunded?",
        placeholder: "e.g. The artist returns it, or it comes off their next payout",
      },
    ],
  },
  {
    id: "discounts",
    title: "Discounts",
    questions: [
      {
        id: "discount_absorbed_by",
        kind: "choice",
        label: "When the gallery gives a buyer a discount, who carries it?",
        required: true,
        options: [
          { value: "gallery", label: "The gallery, out of its commission" },
          { value: "artist", label: "The artist" },
          { value: "shared", label: "Both, in proportion to the split" },
          { value: "no_discounts", label: "We don't give discounts" },
          UNDECIDED,
        ],
      },
      {
        id: "discount_consent",
        kind: "choice",
        label: "Does the artist have to agree to a discount first?",
        options: [
          { value: "always_ask", label: "Yes, always" },
          { value: "up_to_limit", label: "Only above a set limit" },
          { value: "never_ask", label: "No" },
          UNDECIDED,
        ],
      },
      {
        id: "discount_limit_percent",
        kind: "number",
        label: "What discount can the gallery give without asking?",
        min: 0,
        max: 100,
        suffix: "%",
        showIf: { id: "discount_consent", equals: "up_to_limit" },
      },
    ],
  },
  {
    id: "vat",
    title: "VAT",
    intro: "Tell us what the gallery does today, or plans to do. A rough answer is fine.",
    questions: [
      {
        id: "gallery_vat",
        kind: "choice",
        label: "Is the gallery VAT registered?",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          UNSURE,
        ],
      },
      {
        id: "prices_include_vat",
        kind: "choice",
        label: "Do listed prices include VAT?",
        showIf: { id: "gallery_vat", equals: "yes" },
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No, VAT is added" },
          UNSURE,
        ],
      },
      {
        id: "vat_base",
        kind: "choice",
        label: "Is VAT charged on the whole sale price or only on the commission?",
        showIf: { id: "gallery_vat", equals: "yes" },
        options: [
          { value: "full_price", label: "The whole sale price" },
          { value: "commission_only", label: "Only the commission" },
          UNSURE,
        ],
      },
      {
        id: "artists_vat",
        kind: "choice",
        label: "Are any of your artists VAT registered?",
        options: [
          { value: "none", label: "None" },
          { value: "some", label: "Some" },
          UNSURE,
        ],
      },
      {
        id: "artists_vat_effect",
        kind: "longtext",
        label: "How does that change what they are paid?",
        showIf: { id: "artists_vat", equals: "some" },
      },
    ],
  },
  {
    id: "notes",
    title: "Anything else",
    questions: [
      {
        id: "notes",
        kind: "longtext",
        label: "Anything about your terms these questions missed?",
      },
    ],
  },
];

export const TERMS_QUESTIONS = TERMS_SECTIONS.flatMap((s) => s.questions);

export const TERMS_TEXT_LIMITS = { text: 200, longtext: 2000 } as const;

export type TermsValues = Record<string, string>;

export function isTermsQuestionShown(q: TermsQuestion, values: TermsValues): boolean {
  return !q.showIf || values[q.showIf.id] === q.showIf.equals;
}

export type TermsResult =
  | { ok: true }
  | { ok: false; message: string; errors: Record<string, string> };
